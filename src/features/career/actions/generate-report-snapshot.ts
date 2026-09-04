"use server";

import { createClient } from "@/lib/supabase/server";
import { getFullReportData } from "./get-report-data";
import { getPremiumReportData } from "./get-premium-report-data";
import { generatePremiumNarrative } from "@/features/ai/generate-premium-narrative";

export async function generateReportSnapshot(studentId: string, assessmentResultId: string) {
  const supabase = await createClient();

  // Determine if user has premium
  const today = new Date().toISOString();
  const { data: sub } = await supabase
    .from("membership_subscriptions")
    .select("id")
    .eq("user_id", studentId)
    .eq("is_active", true)
    .gte("ends_at", today)
    .limit(1)
    .maybeSingle();

  const isPremium = !!sub;
  const reportType = isPremium ? "premium" : "free";

  // 1. Run dynamic data gathering
  // This will take time (runs AI Narrative + Major Engine)
  const baseData = await getFullReportData(studentId);
  if (!baseData) return { success: false, error: "Failed to get base report data" };

  let premiumData = null;
  if (isPremium) {
    const rawPremium = await getPremiumReportData(studentId);
    if (rawPremium) {
      // Generate premium narrative insights
      const premiumNarrative = await generatePremiumNarrative({
        studentName: baseData.studentInfo.displayName,
        hollandCode: baseData.hollandCode,
        hollandNames: baseData.hollandNames,
        bigFiveTraits: baseData.bigFive.map(t => ({ name: t.name, score: t.score })),
        workValues: baseData.workValues.map(v => ({ name: v.name, score: v.score })),
        topStrengths: baseData.topStrengths.map(s => ({ name: s.name, score: s.score })),
        careerChain: rawPremium.careerChain
      });

      premiumData = {
        ...rawPremium,
        narratives: premiumNarrative
      };
    }
  }

  const reportData = {
    base: baseData,
    premium: premiumData,
  };

  // 2. Save to student_reports
  const { data: report, error } = await supabase
    .from("student_reports")
    .insert({
      student_id: studentId,
      assessment_result_id: assessmentResultId,
      report_type: reportType,
      report_data: reportData,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving report snapshot:", error);
    return { success: false, error: error.message };
  }

  return { success: true, reportId: report.id };
}
