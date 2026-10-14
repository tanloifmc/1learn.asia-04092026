import { createClient } from "@/lib/supabase/server";
import {
  MAJOR_ALGORITHM_VERSION,
  type CareerMatchInput,
  type SupportingCareer,
  type MajorMatch,
  type MajorEngineResult,
} from "./major-engine-types";

export type { CareerMatchInput, SupportingCareer, MajorMatch, MajorEngineResult };

/**
 * MAJOR MATCHING ENGINE V1.0
 * Pure deterministic engine. Consumes output of Career Engine.
 */
export async function runMajorMatching(
  careerMatches: CareerMatchInput[],
  customClient?: any
): Promise<MajorEngineResult> {
  if (!careerMatches || careerMatches.length === 0) {
    return { success: true, status: 'insufficient_data' };
  }

  const supabase = customClient || await createClient();

  const inputByCareerId = new Map(careerMatches.map((match) => [match.career_id, match]));
  const { data: mappings, error: mappingError } = await supabase
    .from("career_major_mappings")
    .select("career_id, relevance_score, majors!inner(code, status, is_production_eligible)")
    .in("career_id", careerMatches.map((match) => match.career_id))
    .eq("status", "published")
    .eq("is_production_eligible", true)
    .eq("majors.status", "published")
    .eq("majors.is_production_eligible", true);

  if (mappingError) {
    return { success: false, status: "error", error: mappingError.message };
  }

  // Aggregate only source-backed career → major relationships. The legacy
  // education_paths JSON remains descriptive content and is not an authority
  // for student recommendations.
  const majorMap = new Map<string, SupportingCareer[]>();

  for (const mapping of mappings ?? []) {
    const careerMatch = inputByCareerId.get(mapping.career_id);
    const major = mapping.majors as { code: string | null } | null;
    const mappingWeight = Number(mapping.relevance_score);
    if (!careerMatch || !major?.code || !Number.isFinite(mappingWeight) || mappingWeight <= 0) continue;

    if (!majorMap.has(major.code)) {
      majorMap.set(major.code, []);
    }

    majorMap.get(major.code)!.push({
      career_id: careerMatch.career_id,
      career_code: careerMatch.career_code,
      career_match_score: careerMatch.match_score,
      mapping_weight: mappingWeight,
    });
  }

  // 3. No Mapping Fallback
  if (majorMap.size === 0) {
    return { success: true, status: 'no_major_mapping' };
  }

  // 4. Calculate Scores and Build Candidates
  const candidates: MajorMatch[] = [];

  for (const [majorCode, supportingCareers] of majorMap.entries()) {
    let sumWeightedScore = 0;
    let sumWeights = 0;
    let maxScore = -1;

    for (const sc of supportingCareers) {
      sumWeightedScore += sc.career_match_score * sc.mapping_weight;
      sumWeights += sc.mapping_weight;
      if (sc.career_match_score > maxScore) {
        maxScore = sc.career_match_score;
      }
    }

    // Weighted average
    const rawScore = sumWeights > 0 ? (sumWeightedScore / sumWeights) : 0;
    // Round to 2 decimal places
    const relevanceScore = Math.round(rawScore * 100) / 100;

    candidates.push({
      major_code: majorCode,
      relevance_score: relevanceScore,
      supporting_career_count: supportingCareers.length,
      max_supporting_career_score: maxScore,
      algorithm_version: MAJOR_ALGORITHM_VERSION,
      supporting_careers: supportingCareers
    });
  }

  // 5. Tie-break Sort
  // 1. relevance_score DESC
  // 2. supporting_career_count DESC
  // 3. max_supporting_career_score DESC
  // 4. major_code ASC
  candidates.sort((a, b) => {
    if (b.relevance_score !== a.relevance_score) {
      return b.relevance_score - a.relevance_score;
    }
    if (b.supporting_career_count !== a.supporting_career_count) {
      return b.supporting_career_count - a.supporting_career_count;
    }
    if (b.max_supporting_career_score !== a.max_supporting_career_score) {
      return b.max_supporting_career_score - a.max_supporting_career_score;
    }
    return a.major_code.localeCompare(b.major_code);
  });

  // 6. Top 10 Limit
  const top10 = candidates.slice(0, 10);

  return {
    success: true,
    status: 'completed',
    matches: top10
  };
}
