"use server";

import { createClient } from "@/lib/supabase/server";

const ALGORITHM_VERSION = "UNIVERSITY_MATCH-V1.0";



/**
 * Strictly distinct actual vs projected score.
 */
interface ScoreInfo {
  score: number;
  scale: number;
  method: string;
  is_projected: boolean;
}

/**
 * Tries to extract or project an admission score from academic records.
 * STRICT RULE: No silent fallback. If we don't have a verified formula, return null.
 */
async function projectAcademicScore(studentId: string, method: string): Promise<ScoreInfo | null> {
  const supabase = await createClient();
  
  const { data: records, error } = await supabase
    .from("academic_records")
    .select("*")
    .eq("student_id", studentId)
    .eq("is_verified", true);

  if (error || !records || records.length === 0) {
    return null; // Insufficient data
  }

  // 1. Look for ACTUAL score first
  const actualRecord = records.find(r => r.record_type === method && r.status === 'final');
  if (actualRecord && actualRecord.score_value) {
    return {
      score: actualRecord.score_value,
      scale: actualRecord.max_score || 30, // Default to 30 for THPT
      method: method,
      is_projected: false
    };
  }

  // 2. Projection (Mode B) - For Grade 10/11
  // STRICT RULE: Only project if we have a defined formula.
  // For V1, if they don't have the actual score, we REFUSE to guess.
  return null;
}

/**
 * Helper to calculate Gap, Trend, Volatility
 */
function analyzeHistoricalData(admissionDataSeries: any[], studentScore: number) {
  if (!admissionDataSeries || admissionDataSeries.length === 0) return null;

  // Sort by year ASC
  admissionDataSeries.sort((a, b) => a.academic_year - b.academic_year);
  
  const latestData = admissionDataSeries[admissionDataSeries.length - 1];
  const latestCutoff = latestData.cutoff_score;
  
  const gap = studentScore - latestCutoff;
  
  // Trend
  let trend = "stable";
  if (admissionDataSeries.length >= 2) {
    const firstCutoff = admissionDataSeries[0].cutoff_score;
    const diff = latestCutoff - firstCutoff;
    if (diff > 0.5) trend = "increasing";
    if (diff < -0.5) trend = "decreasing";
  }

  // Volatility
  let volatility = "low";
  if (admissionDataSeries.length >= 3) {
    const max = Math.max(...admissionDataSeries.map(d => d.cutoff_score));
    const min = Math.min(...admissionDataSeries.map(d => d.cutoff_score));
    if (max - min > 1.5) volatility = "high";
    else if (max - min > 0.5) volatility = "medium";
  }

  // Data Quality
  let quality = "Low";
  if (admissionDataSeries.length >= 3 && admissionDataSeries.every(d => d.data_status === 'published')) {
    quality = "High";
  } else if (admissionDataSeries.length >= 2) {
    quality = "Medium";
  }

  return {
    latest_cutoff: latestCutoff,
    gap: gap,
    trend: trend,
    volatility: volatility,
    quality: quality,
    historical_years_used: admissionDataSeries.map(d => d.academic_year)
  };
}

/**
 * Core Match Algorithm
 */
export async function runUniversityRecommendation(studentId: string, targetMajorId: string, targetMethod: string = "THPT") {
  const supabase = await createClient();

  // 1. Get Student Profile Version
  const { data: profile } = await supabase
    .from("student_career_profiles")
    .select("profile_version")
    .eq("student_id", studentId)
    .order("profile_version", { ascending: false })
    .limit(1)
    .single();

  if (!profile) return { success: false, error: "No student profile found" };

  // 2. Determine Score based on the requested admission method
  const scoreInfo = await projectAcademicScore(studentId, targetMethod);

  // 3. Create Recommendation Run
  const { data: run, error: runError } = await supabase
    .from("university_recommendation_runs")
    .insert({
      student_id: studentId,
      profile_version: profile.profile_version,
      algorithm_version: ALGORITHM_VERSION,
    })
    .select()
    .single();

  if (runError || !run) return { success: false, error: runError?.message };

  // If insufficient data, we still create the run but no tier recommendations
  if (!scoreInfo) {
    return { 
      success: true, 
      run_id: run.id,
      status: "insufficient_data",
      message: "Chưa đủ dữ liệu điểm thực tế để đánh giá khả năng trúng tuyển. Hệ thống chuyển sang chế độ Định hướng Mục tiêu."
    };
  }

  // 4. Fetch Universities offering the Target Major
  const { data: uniMajors } = await supabase
    .from("university_majors")
    .select(`
      id,
      university_id,
      major_id,
      program_type,
      admission_data (*)
    `)
    .eq("major_id", targetMajorId);

  if (!uniMajors) return { success: true, run_id: run.id, recommendations: [] };

  const recommendations = [];

  for (const um of uniMajors) {
    // Filter admission data for matching method and scale
    const compatibleData = um.admission_data.filter((ad: any) => 
      ad.admission_method === scoreInfo.method && 
      ad.score_scale === scoreInfo.scale
    );

    const stats = analyzeHistoricalData(compatibleData, scoreInfo.score);

    if (!stats) {
      recommendations.push({
        run_id: run.id,
        university_id: um.university_id,
        major_id: um.major_id,
        admission_method: scoreInfo.method,
        historical_years_used: [],
        admission_fit_score: null,
        university_fit_score: null, // to be calculated later based on preferences
        fit_breakdown: { note: "Missing compatible admission data" },
        tier: "Unrated",
        data_quality: "Low"
      });
      continue;
    }

    // Determine Tier based on gap, trend, and volatility (Avoid naive +1.5 logic)
    let tier = "Unrated";
    const { gap, trend, volatility } = stats;

    if (gap < 0) {
      tier = "Dream"; // Still a dream if you are below the cutoff
    } else {
      // Student is above or equal to the cutoff
      if (gap >= 2.0 && trend !== "increasing" && volatility !== "high") {
        tier = "Safer Option"; // High margin of safety
      } else {
        // If the gap is small (e.g. 0.5), or the trend is increasing rapidly, or it's highly volatile,
        // it might actually be a Dream/Reach rather than a safe Match.
        if (gap < 1.0 && (trend === "increasing" || volatility === "high")) {
          tier = "Dream"; 
        } else {
          tier = "Match";
        }
      }
    }

    // Admission Fit Score (0-100)
    // 1 gap point = 10% fit change. Gap of 0 = 80%.
    let admissionFit = 80 + (stats.gap * 10);
    admissionFit = Math.max(0, Math.min(100, admissionFit));

    // University Fit Score requires student preferences (location, tuition) which will be added in Phase 6.
    // For now, it remains uncalculated rather than mocked.
    const universityFit = null; 

    recommendations.push({
      run_id: run.id,
      university_id: um.university_id,
      major_id: um.major_id,
      admission_method: scoreInfo.method,
      historical_years_used: stats.historical_years_used,
      admission_fit_score: admissionFit,
      university_fit_score: universityFit,
      fit_breakdown: {
        admission_gap: stats.gap,
        trend: stats.trend,
        volatility: stats.volatility,
        is_projected: scoreInfo.is_projected
      },
      tier: tier,
      data_quality: stats.quality
    });
  }

  if (recommendations.length > 0) {
    // Store recommendations
    await supabase.from("student_university_recommendations").insert(recommendations);
  }

  return { success: true, run_id: run.id, recommendations };
}
