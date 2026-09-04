"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { getActiveRoadmap } from "@/features/roadmap/actions";
import { revalidatePath } from "next/cache";

export async function setCareerGoalAction(careerId: string, majorCode?: string, universityId?: string) {
  const supabase = await createClient();
  const account = await getCurrentAccount();
  if (!account) return { success: false, error: "Not authenticated" };

  const studentId = account.userId;

  // Lookup major_id from code if provided
  let majorId: string | null = null;
  if (majorCode) {
    const { data: major } = await supabase
      .from("majors")
      .select("id")
      .eq("code", majorCode)
      .maybeSingle();
    majorId = major?.id || null;
  }

  // Deactivate existing primary goals
  await supabase
    .from("student_goals")
    .update({ status: "archived" })
    .eq("student_id", studentId)
    .eq("is_primary", true)
    .eq("status", "active");

  // Get student grade for target year calculation
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("grade")
    .eq("id", studentId)
    .maybeSingle();

  const currentYear = new Date().getFullYear();
  const grade = profile?.grade || 10;
  const yearsToGrad = 12 - grade + 1; // Years until graduation
  const targetYear = currentYear + yearsToGrad + 4; // Grad + 4 years uni

  // Create new primary goal
  const { error: goalError } = await supabase
    .from("student_goals")
    .insert({
      student_id: studentId,
      career_id: careerId,
      major_id: majorId,
      university_id: universityId || null,
      is_primary: true,
      status: "active",
      target_year: targetYear,
    });

  if (goalError) return { success: false, error: goalError.message };

  // Check if roadmap already exists for this student
  const { data: existingRoadmap } = await getActiveRoadmap();

  if (!existingRoadmap) {
    // Try to auto-generate roadmap
    try {
      const { generateRoadmapAction } = await import("@/features/roadmap/actions");
      await generateRoadmapAction(studentId, "career", careerId);
    } catch {
      // Roadmap generation failure is non-blocking — goal was still created
    }
  }


  revalidatePath("/goal");
  revalidatePath("/roadmap");
  revalidatePath("/me/bao-cao");

  return { success: true };
}
