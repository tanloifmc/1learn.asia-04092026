"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { RoadmapGenerator } from "@/features/roadmap/engine/roadmap-generator";
import { revalidatePath } from "next/cache";

export async function setCareerGoalAction(
  careerId: string,
  majorCode?: string,
  universityId?: string,
  programId?: string,
) {
  const supabase = await createClient();
  const account = await getCurrentAccount();
  if (!account) return { success: false, error: "Not authenticated" };

  const studentId = account.userId;

  const { data: career, error: careerError } = await supabase
    .from("careers")
    .select("id, name")
    .eq("id", careerId)
    .eq("status", "published")
    .eq("is_production_eligible", true)
    .maybeSingle();

  if (careerError || !career) {
    return { success: false, error: "Không tìm thấy nghề nghiệp mục tiêu." };
  }

  if (!majorCode || !universityId || !programId) {
    return {
      success: false,
      error: "Hãy chọn một chương trình đào tạo cụ thể để tạo lộ trình có điều kiện đầu vào đã được kiểm chứng.",
    };
  }

  const { data: major, error: majorError } = await supabase
    .from("majors")
    .select("id")
    .eq("code", majorCode)
    .eq("status", "published")
    .eq("is_production_eligible", true)
    .maybeSingle();

  if (majorError || !major) {
    return { success: false, error: "Không tìm thấy ngành học mục tiêu đã được kiểm chứng." };
  }

  const { data: mapping, error: mappingError } = await supabase
    .from("career_major_mappings")
    .select("id")
    .eq("career_id", careerId)
    .eq("major_id", major.id)
    .eq("status", "published")
    .eq("is_production_eligible", true)
    .maybeSingle();

  if (mappingError || !mapping) {
    return { success: false, error: "Ngành học này chưa có liên kết đã được kiểm chứng với nghề đã chọn." };
  }

  const { data: program, error: programError } = await supabase
    .from("university_majors")
    .select("id, university_id, major_id")
    .eq("id", programId)
    .eq("university_id", universityId)
    .eq("major_id", major.id)
    .eq("status", "published")
    .eq("is_production_eligible", true)
    .maybeSingle();

  if (programError || !program) {
    return { success: false, error: "Chương trình đào tạo này không còn đủ dữ liệu đã kiểm chứng để lập lộ trình." };
  }

  const majorId = major.id;

  const { error: deactivateError } = await supabase
    .from("student_goals")
    .update({ is_primary: false })
    .eq("student_id", studentId)
    .eq("is_primary", true)
    .eq("status", "active");

  if (deactivateError) return { success: false, error: deactivateError.message };

  // Get student grade for target year calculation
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("grade")
    .eq("id", studentId)
    .maybeSingle();

  const currentYear = new Date().getFullYear();
  const grade = profile?.grade;
  const targetYear = grade && grade >= 1 && grade <= 12
    ? currentYear + (12 - grade + 1) + 4
    : null;

  // Create new primary goal
  const { error: goalError } = await supabase
    .from("student_goals")
    .insert({
      student_id: studentId,
      goal_type: "career",
      goal_text: career.name,
      career_id: careerId,
      major_id: majorId,
      university_id: universityId || null,
      is_primary: true,
      status: "active",
      target_year: targetYear,
    });

  if (goalError) return { success: false, error: goalError.message };

  let roadmapWarning: string | undefined;

  const generator = new RoadmapGenerator(supabase as any);
  const generation = await generator.generateRoadmap(
    studentId,
    "university_major",
    program.id,
    {
      target_career_id: careerId,
      target_major_id: majorId,
      target_university_id: universityId,
      target_program_id: program.id,
    },
  );
  if (generation.status !== "success" && generation.status !== "satisfied") {
    roadmapWarning = generation.message ?? "Chưa thể tạo lộ trình cho mục tiêu này.";
  }


  revalidatePath("/goal");
  revalidatePath("/roadmap");
  revalidatePath("/me/bao-cao");

  return { success: true, roadmapWarning };
}
