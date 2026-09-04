"use server";

import { createClient } from "@/lib/supabase/server";

const ALGORITHM_VERSION = "MATCH-V1.0";
const BASE_WEIGHTS = {
  riasec: 0.40,
  ability: 0.25,
  values: 0.20,
  academic: 0.15,
};

// Helper: Cosine similarity
function cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  for (const key of keys) {
    const valA = vecA[key] || 0;
    const valB = vecB[key] || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function runMatchingEngine(studentId: string, profileVersion?: number, customClient?: any) {
  const supabase = customClient || await createClient();

  // 1. Fetch the profile
  let profileQuery = supabase
    .from("student_career_profiles")
    .select("*")
    .eq("student_id", studentId);
  
  if (profileVersion !== undefined) {
    profileQuery = profileQuery.eq("profile_version", profileVersion);
  } else {
    profileQuery = profileQuery.eq("is_current", true);
  }

  const { data: profile, error: profileError } = await profileQuery.single();

  if (profileError || !profile) {
    return { success: false, error: profileError?.message || "Profile not found" };
  }

  const features = profile.profile_features as any;
  const coverage = profile.evidence_coverage;

  // 2. Check if we have enough coverage
  if (coverage < 0.2) { // Less than 20% coverage -> insufficient
    // Create failed/insufficient match run
    await supabase.from("match_runs").insert({
      student_id: studentId,
      profile_version: profile.profile_version,
      algorithm_version: ALGORITHM_VERSION,
      evidence_coverage: coverage,
      overall_confidence_score: 0,
      overall_confidence_level: 'low',
      status: 'insufficient_data',
      insufficient_reason: 'LOW_EVIDENCE_COVERAGE'
    });
    return { success: true, status: 'insufficient_data' };
  }

  // 3. Compute effective weights
  const hasRiasec = Object.keys(features.interests?.scores || {}).length > 0;
  const hasAbility = Object.keys(features.personality?.scores || {}).length > 0;
  const hasValues = Object.keys(features.work_values?.scores || {}).length > 0;
  const hasAcademic = Object.keys(features.readiness ? {score: features.readiness.score} : {}).length > 0;

  const sumBaseWeights = 
    (hasRiasec ? BASE_WEIGHTS.riasec : 0) +
    (hasAbility ? BASE_WEIGHTS.ability : 0) +
    (hasValues ? BASE_WEIGHTS.values : 0) +
    (hasAcademic ? BASE_WEIGHTS.academic : 0);

  if (sumBaseWeights === 0) {
    // Should be caught by coverage check above, but just in case
    return { success: false, error: "No features available" };
  }

  const effectiveWeights = {
    riasec: hasRiasec ? (BASE_WEIGHTS.riasec / sumBaseWeights) : 0,
    ability: hasAbility ? (BASE_WEIGHTS.ability / sumBaseWeights) : 0,
    values: hasValues ? (BASE_WEIGHTS.values / sumBaseWeights) : 0,
    academic: hasAcademic ? (BASE_WEIGHTS.academic / sumBaseWeights) : 0,
  };

  // Create match_run with 'processing' status (though JS executes linearly so we can just do 'completed' directly if successful)
  const { data: run, error: runError } = await supabase
    .from("match_runs")
    .insert({
      student_id: studentId,
      profile_version: profile.profile_version,
      algorithm_version: ALGORITHM_VERSION,
      evidence_coverage: coverage,
      overall_confidence_score: coverage, // Base confidence on coverage. Can be multiplied by assessment completion quality later
      overall_confidence_level: coverage > 0.7 ? 'high' : (coverage > 0.4 ? 'medium' : 'low'),
      status: 'completed',
    })
    .select()
    .single();

  if (runError || !run) {
    return { success: false, error: runError?.message || "Failed to create match run" };
  }

  // 4. Fetch careers
  const { data: careers, error: careerErr } = await supabase
    .from("careers")
    .select("*")
    .in("status", ["published", "verified"]);

  if (careerErr || !careers || careers.length === 0) {
    if (careerErr) console.error("Career fetch error:", careerErr);
    return { success: true, status: 'completed', matches: 0 };
  }

  const matches = [];

  for (const career of careers) {
    let riasecScore = null;
    let abilityScore = null;
    let valueScore = null;
    let academicScore = null;
    
    // A. RIASEC Score via Cosine Similarity
    if (hasRiasec && career.riasec_profile) {
      // Assuming riasec_profile is { R: 0.9, I: 0.2 ... }
      // Normalize keys to standard R, I, A, S, E, C
      const stRiasec: Record<string, number> = {};
      for (const [key, val] of Object.entries(features.interests.scores)) {
        stRiasec[key.charAt(0).toUpperCase()] = val as number;
      }
      riasecScore = cosineSimilarity(stRiasec, career.riasec_profile as any) * 100;
    }

    // Ability Score
    if (hasAbility && career.ability_weights) {
      const studentAbilities = features.personality.scores || {};
      const weights = career.ability_weights as Record<string, number>;
      let num = 0;
      let den = 0;
      for (const [key, weight] of Object.entries(weights)) {
        if (weight > 0) {
          const sVal = studentAbilities[key] || 0; 
          num += sVal * weight;
          den += weight;
        }
      }
      abilityScore = den > 0 ? (num / den) * 10 : 0; // Assuming student ability is 0-10 scale
    }

    // Value Score
    if (hasValues && career.value_weights) {
      const studentValues = features.work_values.scores || {};
      const weights = career.value_weights as Record<string, number>;
      let num = 0;
      let den = 0;
      for (const [key, weight] of Object.entries(weights)) {
        if (weight > 0) {
          const sVal = studentValues[key] || 0;
          num += sVal * weight;
          den += weight;
        }
      }
      valueScore = den > 0 ? (num / den) * 10 : 0; // Assuming 0-10 scale
    }

    // Academic Score (Simplified % based on min GPA if any, else 100% if missing requirement)
    if (hasAcademic) {
      const studentGpa = features.readiness?.score || 0; // Readiness score is 0-100
      const reqGpa = career.academic_requirements?.min_gpa || 0;
      if (reqGpa > 0) {
        academicScore = studentGpa >= reqGpa ? 100 : (studentGpa / reqGpa) * 100;
      } else {
        academicScore = 100; // No specific requirement means 100% match
      }
    }

    // Compute composite match score
    const finalScore = 
      ((riasecScore || 0) * effectiveWeights.riasec) +
      ((abilityScore || 0) * effectiveWeights.ability) +
      ((valueScore || 0) * effectiveWeights.values) +
      ((academicScore || 0) * effectiveWeights.academic);

    // Factors Generation
    const factors = [];
    if (riasecScore && riasecScore > 80) {
      factors.push({
        factor: "RIASEC Match",
        source: "RIASEC-v1.0",
        student_value: riasecScore,
        career_requirement: 80,
        direction: "positive",
        magnitude: riasecScore - 80
      });
    }

    matches.push({
      run_id: run.id,
      career_id: career.id,
      career_code: career.code,
      match_score: Math.round(finalScore * 100) / 100,
      riasec_score: riasecScore ? Math.round(riasecScore * 100) / 100 : null,
      ability_score: abilityScore ? Math.round(abilityScore * 100) / 100 : null,
      value_score: valueScore ? Math.round(valueScore * 100) / 100 : null,
      academic_score: academicScore ? Math.round(academicScore * 100) / 100 : null,
      effective_weights: effectiveWeights,
      confidence_score: coverage, // Base confidence on coverage
      confidence_level: coverage > 0.7 ? 'high' : (coverage > 0.4 ? 'medium' : 'low'),
      evidence_coverage: coverage,
      factors: factors,
      // Generate Gaps (if required skills exist but are missing in student profile, though this MVP might lack full skill extraction)
      gaps: [], 
      required_skills: career.skills || []
    });
  }

  // 5. Sort matches (Tie-breaking rule)
  // 1. match_score DESC, 2. confidence DESC, 3. evidence_coverage DESC, 4. career_code ASC
  matches.sort((a, b) => {
    if (b.match_score !== a.match_score) return b.match_score - a.match_score;
    if (b.confidence_score !== a.confidence_score) return b.confidence_score - a.confidence_score;
    if (b.evidence_coverage !== a.evidence_coverage) return b.evidence_coverage - a.evidence_coverage;
    return a.career_code.localeCompare(b.career_code);
  });

  // Assign ranks and remove career_code helper field before insert
  const toInsert = matches.map((m, index) => {
    const { career_code, ...rest } = m;
    return {
      ...rest,
      rank: index + 1
    };
  });

  // Take top N or all? Let's insert top 20 or all
  const { error: insertMatchesError } = await supabase
    .from("career_matches")
    .insert(toInsert);

  if (insertMatchesError) {
    return { success: false, error: insertMatchesError.message };
  }
  
  await supabase
    .from("match_runs")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", run.id);

  return { success: true, runId: run.id };
}
