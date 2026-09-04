"use server";

import { createClient } from "@/lib/supabase/server";
import { generateNarrative, type NarrativeResult } from "@/features/ai/generate-narrative";

export interface CareerMatchForReport {
  careerId: string;
  careerName: string;
  careerCode: string;
  matchScore: number;
  confidenceLevel: string;
  category: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  factors: any[];
}

export interface ReportDimensionScore {
  code: string;
  name: string;
  framework: string;
  description: string | null;
  score: number;
}

export interface StudentInfo {
  displayName: string;
  initials: string;
  grade: number | null;
  region: string | null;
  avatarColor: string;
  avatarUrl?: string | null;
}

export interface FullReportData {
  resultId: string;
  completedAt: string;
  confidence: number;
  studentInfo: StudentInfo;
  dimensions: ReportDimensionScore[];
  careerMatches: CareerMatchForReport[];
  riasec: ReportDimensionScore[];
  bigFive: ReportDimensionScore[];
  workValues: ReportDimensionScore[];
  gardnerIntelligences: ReportDimensionScore[];
  topStrengths: ReportDimensionScore[];
  developmentAreas: ReportDimensionScore[];
  hollandCode: string;
  hollandNames: string;
  aiNarrative: NarrativeResult;
}

// Generate a consistent avatar color from initials
function getAvatarColor(name: string): string {
  const colors = [
    "#4A2545", "#1A3A6B", "#1A5C3A", "#7B3A1A",
    "#2D5A7B", "#5A3A7B", "#7B5A1A", "#1A5A5C",
  ];
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");
}

export async function getFullReportData(studentId: string): Promise<FullReportData | null> {
  const supabase = await createClient();

  // 1. Fetch latest assessment result + student profile in parallel
  const [resultRes, profileRes] = await Promise.all([
    supabase
      .from("assessment_results")
      .select("id, confidence, completed_at")
      .eq("student_id", studentId)
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("student_profiles")
      .select("grade, region, profiles(display_name, avatar_url)")
      .eq("id", studentId)
      .maybeSingle(),
  ]);

  if (!resultRes.data) return null;
  const result = resultRes.data;
  const profile = profileRes.data;
  const baseProfile = profile?.profiles as any;

  // Build student info
  const rawName = baseProfile?.display_name || "Học sinh";
  const studentInfo: StudentInfo = {
    displayName: rawName,
    initials: getInitials(rawName),
    grade: profile?.grade || null,
    region: profile?.region || null,
    avatarColor: getAvatarColor(rawName),
    avatarUrl: baseProfile?.avatar_url || null,
  };

  // 2. Fetch ALL dimension scores with metadata
  const { data: dimScores } = await supabase
    .from("assessment_result_dimensions")
    .select("score, assessment_dimensions(code, name, framework, description)")
    .eq("result_id", result.id)
    .order("score", { ascending: false });

  if (!dimScores || dimScores.length === 0) return null;

  const allDimensions: ReportDimensionScore[] = dimScores.map(d => ({
    code: (d.assessment_dimensions as any).code,
    name: (d.assessment_dimensions as any).name,
    framework: (d.assessment_dimensions as any).framework,
    description: (d.assessment_dimensions as any).description,
    score: Math.round(d.score),
  }));

  const byFramework = (fw: string) => allDimensions.filter(d => d.framework === fw);

  const riasec = byFramework("riasec").sort((a, b) => b.score - a.score);
  const bigFive = byFramework("big_five").sort((a, b) => b.score - a.score);
  const workValues = byFramework("work_values").sort((a, b) => b.score - a.score);
  const gardnerIntelligences = byFramework("gardner").sort((a, b) => b.score - a.score);

  // Top 3 Holland code
  const top3Riasec = riasec.slice(0, 3);
  const hollandCode = top3Riasec.map(r => r.code.charAt(0).toUpperCase()).join(" · ");
  const hollandNames = top3Riasec.map(r => r.name).join(" · ");

  // Strengths: score >= 65
  const topStrengths = allDimensions
    .filter(d => d.score >= 65)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Development areas: score <= 45
  const developmentAreas = allDimensions
    .filter(d => d.score <= 45)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  // 3. Fetch career matches from last match run
  const { data: matchRun } = await supabase
    .from("match_runs")
    .select("id")
    .eq("student_id", studentId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let careerMatches: CareerMatchForReport[] = [];

  if (matchRun) {
    const { data: matches } = await supabase
      .from("career_matches")
      .select("match_score, confidence_level, factors, careers(id, name, code, category, salary_min, salary_max)")
      .eq("run_id", matchRun.id)
      .order("rank", { ascending: true })
      .limit(5);

    if (matches) {
      careerMatches = matches.map(m => ({
        careerId: (m.careers as any).id,
        careerName: (m.careers as any).name,
        careerCode: (m.careers as any).code,
        matchScore: Math.round(m.match_score),
        confidenceLevel: m.confidence_level,
        category: (m.careers as any).category,
        salaryMin: (m.careers as any).salary_min,
        salaryMax: (m.careers as any).salary_max,
        factors: (m.factors as any[]) || [],
      }));
    }
  }

  // 4. Generate AI narrative (DeepSeek) — falls back to template if no key
  const aiNarrative = await generateNarrative({
    studentName: studentInfo.displayName,
    grade: profile?.grade || null,
    hollandCode,
    hollandNames,
    topStrengths: topStrengths.map(s => ({ name: s.name, score: s.score })),
    developmentAreas: developmentAreas.map(d => ({ name: d.name, score: d.score })),
    topCareerName: careerMatches[0]?.careerName || null,
    topCareerScore: careerMatches[0]?.matchScore || null,
    topWorkValue: workValues[0]?.name || null,
    topBigFive: bigFive[0]?.name || null,
  });

  return {
    resultId: result.id,
    completedAt: result.completed_at,
    confidence: typeof result.confidence === 'number' ? result.confidence : (result.confidence as any)?.overall || 0,
    studentInfo,
    dimensions: allDimensions,
    careerMatches,
    riasec,
    bigFive,
    workValues,
    gardnerIntelligences,
    topStrengths,
    developmentAreas,
    hollandCode,
    hollandNames,
    aiNarrative,
  };
}
