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

  // 1. Fetch careers mapping to ensure we have education_paths if not provided in input
  // Extract career codes from input
  const careerCodes = careerMatches.map(c => c.career_code);
  let careerDataMap = new Map<string, any>();

  // If input doesn't have education_paths populated, fetch from DB
  const needsFetch = careerMatches.some(c => !c.education_paths);
  if (needsFetch) {
    const { data: careersData, error } = await supabase
      .from('careers')
      .select('code, education_paths')
      .in('code', careerCodes);

    if (error) {
      return { success: false, status: 'error', error: error.message };
    }

    if (careersData) {
      for (const c of careersData) {
        careerDataMap.set(c.code, c.education_paths || []);
      }
    }
  }

  // 1.5 Extract ALL potential major codes to verify existence
  const potentialMajorCodes = new Set<string>();
  for (const cm of careerMatches) {
    const paths = cm.education_paths || careerDataMap.get(cm.career_code) || [];
    for (const path of paths) {
      if (path && path.major_code) {
        potentialMajorCodes.add(path.major_code);
      }
    }
  }

  // Verify major existence in authoritative majors table
  const validMajorCodes = new Set<string>();
  if (potentialMajorCodes.size > 0) {
    const { data: validMajors, error: majorErr } = await supabase
      .from('majors')
      .select('code')
      .in('code', Array.from(potentialMajorCodes));

    if (majorErr) {
      return { success: false, status: 'error', error: majorErr.message };
    }

    if (validMajors) {
      validMajors.forEach((m: { code: string }) => validMajorCodes.add(m.code));
    }
  }

  // 2. Aggregate Majors
  const majorMap = new Map<string, SupportingCareer[]>();

  for (const cm of careerMatches) {
    // Determine mapping paths
    const paths = cm.education_paths || careerDataMap.get(cm.career_code) || [];
    
    // De-duplicate majors within a single career (in case DB has dupes)
    const uniqueMajorCodes = new Set<string>();
    
    for (const path of paths) {
      if (!path || !path.major_code) continue;
      
      const majorCode = path.major_code;

      // Contract Check: Must exist in validMajorCodes
      if (!validMajorCodes.has(majorCode)) continue;

      if (uniqueMajorCodes.has(majorCode)) continue;
      uniqueMajorCodes.add(majorCode);

      // Contract check: use weight = 1 as authoritative rule V1.0
      const mappingWeight = 1; 

      if (!majorMap.has(majorCode)) {
        majorMap.set(majorCode, []);
      }

      majorMap.get(majorCode)!.push({
        career_id: cm.career_id,
        career_code: cm.career_code,
        career_match_score: cm.match_score,
        mapping_weight: mappingWeight,
      });
    }
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
