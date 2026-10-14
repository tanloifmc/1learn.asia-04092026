"use server";

import { createClient } from "@/lib/supabase/server";
import { runMajorMatching } from "@/features/university/actions/major-engine";
import type { CareerMatchInput } from "@/features/university/actions/major-engine-types";
import type { PremiumNarrativeResult } from "@/features/ai/generate-premium-narrative";

export interface MajorWithUniversities {
  majorCode: string;
  majorName: string;
  fieldName: string | null;
  relevanceScore: number;
  universities: {
    programId: string;
    universityId: string;
    universityName: string;
    shortName: string | null;
    type: string | null;
    province: string | null;
    minScore: number | null;
    maxScore: number | null;
  }[];
}

export interface CareerChainItem {
  careerId: string;
  careerName: string;
  careerCode: string;
  matchScore: number;
  category: string | null;
  description: string | null;
  requiredSkills: string[];
  majors: MajorWithUniversities[];
}

export type CareerCatalogStatus = "available" | "insufficient";

export interface PremiumReportData {
  careerChain: CareerChainItem[];
  studentGrade: number | null;
  gapAnalysis: { skill: string; hasIt: boolean }[];
  careerCatalogStatus: CareerCatalogStatus;
  narratives?: PremiumNarrativeResult;
}

export async function getPremiumReportData(studentId: string): Promise<PremiumReportData | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== studentId) return null;

  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("grade")
    .eq("id", studentId)
    .maybeSingle();

  // 1. Get latest match run
  const { data: matchRun } = await supabase
    .from("match_runs")
    .select("id, status")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!matchRun || matchRun.status !== "completed") {
    return {
      careerChain: [],
      studentGrade: studentProfile?.grade || null,
      gapAnalysis: [],
      careerCatalogStatus: "insufficient",
    };
  }

  // 2. Fetch top 5 career matches with full career data
  const { data: rawMatches } = await supabase
    .from("career_matches")
    .select(`
      match_score,
      careers(id, name, code, career_domain_code, description, skills, education_paths)
    `)
    .eq("run_id", matchRun.id)
    .order("rank", { ascending: true })
    .limit(5);

  if (!rawMatches || rawMatches.length === 0) {
    return {
      careerChain: [],
      studentGrade: studentProfile?.grade || null,
      gapAnalysis: [],
      careerCatalogStatus: "insufficient",
    };
  }

  // 4. For each career, run major matching then fetch universities
  const careerChain: CareerChainItem[] = [];

  for (const m of rawMatches) {
    const career = m.careers as any;
    if (!career?.id) continue;

    // Run major engine for this single career
    const careerInput: CareerMatchInput[] = [{
      career_id: career.id,
      career_code: career.code,
      match_score: m.match_score,
      education_paths: career.education_paths || [],
    }];

    const majorResult = await runMajorMatching(careerInput);
    const majorMatches = majorResult.status === "completed" ? (majorResult.matches || []).slice(0, 3) : [];

    // For each major, fetch universities
    const majorsWithUnis: MajorWithUniversities[] = [];

    for (const mm of majorMatches) {
      // Get major details
      const { data: majorData } = await supabase
        .from("majors")
        .select("id, name, fields(name)")
        .eq("code", mm.major_code)
        .eq("status", "published")
        .eq("is_production_eligible", true)
        .maybeSingle();

      if (!majorData) continue;

      // Get universities offering this major (via university_majors junction + admission_data)
      const { data: uniMajors } = await supabase
        .from("university_majors")
        .select(`
          id,
          universities(id, name, short_name, type, location_region),
          admission_data(cutoff_score)
        `)
        .eq("major_id", majorData.id)
        .eq("status", "published")
        .eq("is_production_eligible", true)
        .limit(20);

      // Aggregate universities with min/max scores
      const uniMap = new Map<string, { programId: string; uni: any; scores: number[] }>();
      for (const um of (uniMajors || [])) {
        const uni = um.universities as any;
        if (!uni) continue;
        if (!uniMap.has(um.id)) {
          uniMap.set(um.id, { programId: um.id, uni, scores: [] });
        }
        const admScore = (um.admission_data as any)?.cutoff_score;
        if (admScore != null) uniMap.get(um.id)!.scores.push(admScore);
      }

      const universities = Array.from(uniMap.values())
        .slice(0, 4)
        .map(({ programId, uni, scores }) => ({
          programId,
          universityId: uni.id,
          universityName: uni.name,
          shortName: uni.short_name,
          type: uni.type,
          province: uni.location_region,
          minScore: scores.length > 0 ? Math.min(...scores) : null,
          maxScore: scores.length > 0 ? Math.max(...scores) : null,
        }));

      majorsWithUnis.push({
        majorCode: mm.major_code,
        majorName: majorData.name,
        fieldName: (majorData.fields as any)?.name || null,
        relevanceScore: Math.round(mm.relevance_score),
        universities,
      });
    }

    // Skills gap analysis: what skills does this career require vs what student likely has
    const requiredSkills: string[] = Array.isArray(career.skills) ? career.skills.slice(0, 6) : [];

    careerChain.push({
      careerId: career.id,
      careerName: career.name,
      careerCode: career.code,
      matchScore: Math.round(m.match_score),
      category: career.career_domain_code,
      description: career.description,
      requiredSkills,
      majors: majorsWithUnis,
    });
  }

  // 5. Simple gap analysis from student interests vs career skills
  const { data: interests } = await supabase
    .from("student_interests")
    .select("interest_area")
    .eq("student_id", studentId);

  const interestAreas = new Set((interests || []).map(i => i.interest_area.toLowerCase()));
  const topCareer = careerChain[0];
  const gapAnalysis = topCareer
    ? topCareer.requiredSkills.map(skill => ({
        skill,
        hasIt: [...interestAreas].some(area => area.includes(skill.toLowerCase().slice(0, 4))),
      }))
    : [];

  return {
    careerChain,
    studentGrade: studentProfile?.grade || null,
    gapAnalysis,
    careerCatalogStatus: careerChain.length > 0 ? "available" : "insufficient",
  };
}
