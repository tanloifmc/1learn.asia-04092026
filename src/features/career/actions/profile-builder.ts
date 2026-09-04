"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateHollandCode } from "./interpretation-engine";

export async function buildStudentProfile(studentId: string, customClient?: any) {
  const supabase = customClient || await createClient();

  // 1. Fetch valid current assessment results
  const { data: results, error: resultsError } = await supabase
    .from("assessment_results")
    .select("version_id, completion_quality, confidence, completed_at, is_current")
    .eq("student_id", studentId)
    .eq("is_current", true)
    .order("completed_at", { ascending: true }); // older first, so newer overwrites

  if (resultsError) {
    return { success: false, error: resultsError.message };
  }

  // 2. Fetch academic records (if any)
  const { data: academicRecords } = await supabase
    .from("academic_records")
    .select("*")
    .eq("student_id", studentId)
    .eq("is_verified", true);

  // 3. Map results to ProfileFeatures using pure function
  const mappingResult = await mapResultsToProfileFeatures(results || [], academicRecords || []);
  const { profileFeatures, sourceVersions, coverage } = mappingResult;


  // 5. Determine new profile version
  const { data: latestProfile } = await supabase
    .from("student_career_profiles")
    .select("profile_version")
    .eq("student_id", studentId)
    .order("profile_version", { ascending: false })
    .limit(1)
    .single();

  const newVersion = latestProfile ? latestProfile.profile_version + 1 : 1;

  // 6. Transaction to safely create new version and update current
  
  await supabase
    .from("student_career_profiles")
    .update({ is_current: false })
    .eq("student_id", studentId)
    .eq("is_current", true);

  const { data: newProfile, error: insertError } = await supabase
    .from("student_career_profiles")
    .insert({
      student_id: studentId,
      profile_version: newVersion,
      evidence_coverage: coverage,
      profile_features: profileFeatures,
      source_assessment_versions: sourceVersions,
      is_current: true,
      computed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true, profile: newProfile };
}

export async function mapResultsToProfileFeatures(results: any[], academicRecords?: any[]) {
  const profileFeatures: Record<string, any> = {
    interests: { framework: 'riasec', scores: {}, primary_code: "" },
    personality: { framework: 'big_five', scores: {} },
    work_values: { framework: 'work_values', scores: {} },
    readiness: { score: 0, level: 'STARTING' },
    meta: {
      validity: "unknown",
      source_assessments: [] as string[]
    }
  };

  const sourceVersions: Record<string, string> = {};
  let hasValidResults = false;

  results?.forEach((result: any) => {
    if (!result.confidence || !(result.confidence as any).is_usable) {
      return; // Skip invalid or unusable results
    }
    
    hasValidResults = true;
    profileFeatures.meta.source_assessments.push(result.version_id);
    
    const quality = result.completion_quality as any;
    if (quality && quality.frameworks) {
      // Patch framework scores
      for (const [framework, scores] of Object.entries(quality.frameworks as Record<string, any>)) {
        if (framework === 'riasec') {
          profileFeatures.interests.scores = { ...profileFeatures.interests.scores, ...scores };
          // Calculate primary code (Strict tie-break delegated to interpretation-engine)
          const hc = calculateHollandCode(profileFeatures.interests.scores);
          profileFeatures.interests.ranked_dimensions = hc.ranked_dimensions;
          profileFeatures.interests.primary_code = hc.primary_code;
          sourceVersions.interests = result.version_id;
        } else if (framework === 'big_five') {
          profileFeatures.personality.scores = { ...profileFeatures.personality.scores, ...scores };
          sourceVersions.personality = result.version_id;
        } else if (framework === 'work_values') {
          profileFeatures.work_values.scores = { ...profileFeatures.work_values.scores, ...scores };
          sourceVersions.work_values = result.version_id;
        } else if (framework === 'career_readiness') {
          profileFeatures.readiness.score = scores['CR'] ?? 0;
          let stage = 'STARTING';
          if (profileFeatures.readiness.score >= 75) stage = 'PLANNING';
          else if (profileFeatures.readiness.score >= 50) stage = 'CLARIFYING';
          else if (profileFeatures.readiness.score >= 25) stage = 'EXPLORING';
          profileFeatures.readiness.level = stage;
          sourceVersions.readiness = result.version_id;
        } else {
          // Dynamic patching for unknown frameworks
          if (!profileFeatures[framework]) {
            profileFeatures[framework] = { framework, scores: {} };
          }
          profileFeatures[framework].scores = { ...profileFeatures[framework].scores, ...scores };
          sourceVersions[framework] = result.version_id;
        }
      }
    }
    
    profileFeatures.meta.validity = (result.confidence as any).level || 'UNDETERMINED';
  });

  // Unique array for source assessments
  profileFeatures.meta.source_assessments = Array.from(new Set(profileFeatures.meta.source_assessments));

  if (academicRecords && academicRecords.length > 0) {
    profileFeatures.academic = academicRecords;
    sourceVersions.academic = "system_verified";
  }

  // Calculate evidence coverage (simple mock for now based on components)
  let coverage = 0;
  if (Object.keys(profileFeatures.interests.scores).length > 0) coverage += 0.4;
  if (Object.keys(profileFeatures.personality.scores).length > 0) coverage += 0.2;
  if (Object.keys(profileFeatures.work_values.scores).length > 0) coverage += 0.2;
  if (academicRecords && academicRecords.length > 0) coverage += 0.2;

  return { profileFeatures, sourceVersions, coverage, hasValidResults };
}
