"use server";

import { createClient } from "@/lib/supabase/server";
import { generateReportSnapshot } from "./generate-report-snapshot";
import { buildStudentProfile } from "./profile-builder";
import { runMatchingEngine } from "./matching-engine";

export async function resumeReportGenerationAction(resultId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // First, verify the result belongs to this user
  const { data: result, error: resultError } = await supabase
    .from("assessment_results")
    .select("id, confidence")
    .eq("id", resultId)
    .eq("student_id", user.id)
    .single();

  if (resultError || !result) {
    return { success: false, error: "Assessment result not found or unauthorized" };
  }

  const confidence = result.confidence as { level?: string; is_usable?: boolean } | null;
  if (!confidence?.is_usable || !["VALID", "QUESTIONABLE"].includes(confidence.level ?? "")) {
    return { success: false, error: "Assessment result is not eligible for report generation." };
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    // 1. Ensure profile is built
    const profileResult = await buildStudentProfile(user.id, adminClient);
    if (!profileResult.success || !profileResult.profile) {
      return { success: false, error: "Profile builder failed: " + profileResult.error };
    }

    // 2. Ensure matching engine has run
    await runMatchingEngine(user.id, profileResult.profile.profile_version, adminClient);

    // 3. Generate snapshot
    const snapshotResult = await generateReportSnapshot(user.id, result.id);
    if (!snapshotResult.success) {
      return { success: false, error: "Failed to generate report snapshot: " + snapshotResult.error };
    }

    return { success: true, reportId: snapshotResult.reportId };
  } catch (err: any) {
    console.error("Resume report generation error:", err);
    return { success: false, error: err.message || "Unknown error occurred" };
  }
}
