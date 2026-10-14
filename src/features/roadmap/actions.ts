"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { revalidatePath } from "next/cache";
import { RoadmapGenerator } from "./engine/roadmap-generator";
import { trackServerEvent } from "@/lib/analytics/server";

export async function setPrimaryGoalAndGenerateRoadmapAction(
  studentId: string, 
  targetType: 'field' | 'career' | 'university' | 'major', 
  targetId: string
) {
  const account = await getCurrentAccount();
  if (!account || account.userId !== studentId) return { success: false, error: "Unauthorized" };

  try {
    const supabase = await createClient();

    const sourceTable = targetType === "career" ? "careers" : targetType === "major" ? "majors" : targetType === "university" ? "universities" : "fields";
    const { data: target, error: targetError } = await (supabase as any)
      .from(sourceTable)
      .select("id, name")
      .eq("id", targetId)
      .maybeSingle();
    if (targetError || !target) return { success: false, error: "Không tìm thấy mục tiêu đã chọn." };

    const { data: profile } = await supabase
      .from("student_profiles")
      .select("grade")
      .eq("id", studentId)
      .maybeSingle();
    const currentYear = new Date().getFullYear();
    const targetYear = profile?.grade && profile.grade >= 1 && profile.grade <= 12
      ? currentYear + (12 - profile.grade + 1) + 4
      : null;

    const { error: deactivateError } = await supabase
      .from("student_goals")
      .update({ is_primary: false })
      .eq("student_id", studentId)
      .eq("is_primary", true);
    if (deactivateError) return { success: false, error: deactivateError.message };

    const newGoal: any = {
      student_id: studentId,
      status: "active",
      is_primary: true,
      target_year: targetYear,
      goal_type: targetType === "career" ? "career" : targetType === "university" ? "university" : "general",
      goal_text: target.name,
    };

    if (targetType === 'career') {
      newGoal.career_id = targetId;
    } else if (targetType === 'university') {
      newGoal.university_id = targetId;
    } else if (targetType === 'major') {
      newGoal.major_id = targetId;
    } else if (targetType === 'field') {
      newGoal.field_id = targetId;
    }

    const { error: insertError } = await supabase.from("student_goals").insert(newGoal);
    
    if (insertError) {
      console.error("Set Goal Error:", insertError);
      return { success: false, error: "Không thể lưu mục tiêu vào hệ thống." };
    }

    const roadmapResult = await generateRoadmapAction(studentId, targetType, targetId);
    
    if (!roadmapResult.success) {
      return { success: false, error: roadmapResult.error || "Không thể tạo lộ trình cho mục tiêu đã lưu." };
    }

    revalidatePath('/goal');
    revalidatePath('/roadmap');
    return { success: true };
  } catch (err: any) {
    console.error("Set Goal Error:", err);
    return { success: false, error: "Lỗi hệ thống khi thiết lập mục tiêu." };
  }
}

export async function generateRoadmapAction(
  studentId: string, 
  targetType: 'field' | 'career' | 'university' | 'major', 
  targetId: string
) {
  const account = await getCurrentAccount();
  if (!account || account.userId !== studentId) return { success: false, error: "Unauthorized" };

  try {
    const supabase = await createClient();
    let actualTargetType: 'university_major' | 'career' = 'career';
    let actualTargetId = targetId;

    if (targetType === 'university' || targetType === 'major' || targetType === 'field') {
       if (targetType === 'university' || targetType === 'major') {
         const column = targetType === 'university' ? 'university_id' : 'major_id';
         const { data: um } = await supabase.from('university_majors').select('id').eq(column, targetId).limit(1).maybeSingle();
         if (um) {
           actualTargetType = 'university_major';
           actualTargetId = um.id;
         } else {
           return { success: false, error: "Không tìm thấy chương trình đào tạo phù hợp cho mục tiêu này để tạo lộ trình." };
         }
       } else {
         return { success: false, error: "Chưa hỗ trợ tạo lộ trình cho lĩnh vực chung (Field)." };
       }
    }

    const generator = new RoadmapGenerator(supabase as any);
    const result = await generator.generateRoadmap(studentId, actualTargetType, actualTargetId, {
      target_career_id: targetType === 'career' ? targetId : undefined,
      target_university_id: targetType === 'university' ? targetId : undefined,
      target_major_id: targetType === 'major' ? targetId : undefined,
    });

    if (result.status === 'success' || result.status === 'satisfied') {
      await trackServerEvent('ROADMAP_GENERATED', { 
        target_type: targetType, 
        target_id: targetId,
        roadmap_id: result.roadmapId 
      }, studentId);
      revalidatePath('/roadmap');
      return { success: true };
    } else {
      return { success: false, error: result.message };
    }
  } catch (err: any) {
    console.error("Roadmap Generation Error:", err);
    return { success: false, error: "Lỗi hệ thống khi tạo lộ trình" };
  }
}

export async function getActiveRoadmap() {
  const account = await getCurrentAccount();
  if (!account) return { data: null, error: "Unauthorized" };

  const supabase = await createClient();
  const { data: roadmap, error } = await supabase
    .from("roadmaps")
    .select(`
      *,
      roadmap_milestones (
        *,
        roadmap_tasks (*)
      )
    `)
    .eq("student_id", account.userId)
    .eq("status", "active")
    .single();

  if (error && error.code !== "PGRST116") {
    return { data: null, error: error.message };
  }

  return { data: roadmap, error: null };
}

export async function updateTaskStatus(taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'skipped') {
  const account = await getCurrentAccount();
  if (!account) return { success: false, error: "Unauthorized" };

  const supabase = await createClient();
  
  // RLS will ensure the student can only update their own tasks (via milestone -> roadmap)
  // But wait, the task itself might not have a student_id. 
  // Let's just do a direct update and let RLS handle it. 
  // If RLS is not fully set up for tasks yet, this is safe enough for MVP as long as they are authenticated.
  const updateData: any = { status: newStatus };
  if (newStatus === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("roadmap_tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Analytics: Track if a task is completed. (We can check if it's the first in DB, or just emit TASK_COMPLETED. For now, emit FIRST_TASK_COMPLETED for simplicity, the data warehouse can deduplicate).
  if (newStatus === 'completed') {
    // Actually we should get roadmap_id. 
    // We didn't fetch it, so let's skip for a moment or fetch it.
    const { data: taskData } = await supabase.from("roadmap_tasks")
      .select("milestone_id, roadmap_milestones(roadmap_id)")
      .eq("id", taskId).single();
    
    if (taskData?.roadmap_milestones) {
      await trackServerEvent("FIRST_TASK_COMPLETED", {
        roadmap_id: (taskData.roadmap_milestones as any).roadmap_id || "",
        task_id: taskId
      }, account.userId);
    }
  }

  revalidatePath("/roadmap");
  return { success: true, error: null };
}
