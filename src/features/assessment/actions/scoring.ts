"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateScoringV1, type RawResponse, type DimensionMeta, type AssessmentScoringConfig } from "../utils/scoring";
import { buildStudentProfile } from "../../career/actions/profile-builder";
import { runMatchingEngine } from "../../career/actions/matching-engine";
import { generateReportSnapshot } from "../../career/actions/generate-report-snapshot";
import { trackServerEvent } from "@/lib/analytics/server";

export async function calculateAndCompleteSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // 1. Fetch Session
  const { data: session, error: sessionError } = await supabase
    .from("assessment_sessions")
    .select("*, assessment_versions(scoring_rules_version, config)")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session || session.student_id !== user.id) {
    return { success: false, error: "Session not found or unauthorized" };
  }

  if (session.status === 'completed') {
    return { success: false, error: "Session already completed" };
  }

  // 2. Fetch total question count for this version (for accurate completion rate)
  const { count: totalQuestions } = await supabase
    .from("assessment_questions")
    .select("*", { count: "exact", head: true })
    .eq("version_id", session.version_id);

  const totalQCount = totalQuestions ?? 121; // fallback to 121 if count fails

  // 3. Fetch all Responses with their question metadata
  const { data: responses, error: responseError } = await supabase
    .from("assessment_responses")
    .select(`
      response_value,
      assessment_questions!inner(
        id,
        question_code,
        dimension_id,
        is_reverse_scored,
        weight,
        assessment_dimensions!inner(
          id,
          framework,
          matching_role
        )
      )
    `)
    .eq("session_id", sessionId);

  if (responseError || !responses || responses.length === 0) {
    return { success: false, error: "No responses found for this session" };
  }

  // 3. Fetch all Dimensions for this version (needed for normalization metadata)
  const { data: dimensionRows, error: dimError } = await supabase
    .from("assessment_dimensions")
    .select("id, code, name, framework, raw_min, raw_max, normalization_formula, matching_role")
    .eq("version_id", session.version_id);

  if (dimError || !dimensionRows) {
    return { success: false, error: "Dimension metadata not found" };
  }

  // 4. Map data into scoring engine types
  const rawResponses: RawResponse[] = responses.map((r: any) => ({
    question_id: r.assessment_questions.id,
    question_code: r.assessment_questions.question_code,
    dimension_id: r.assessment_questions.dimension_id,
    framework: r.assessment_questions.assessment_dimensions.framework,
    matching_role: r.assessment_questions.assessment_dimensions.matching_role,
    is_reverse_scored: r.assessment_questions.is_reverse_scored,
    weight: r.assessment_questions.weight,
    response_value: r.response_value,
  }));

  const dimensions: DimensionMeta[] = dimensionRows.map((d: any) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    framework: d.framework,
    raw_min: d.raw_min,
    raw_max: d.raw_max,
    normalization_formula: d.normalization_formula,
    matching_role: d.matching_role,
  }));

  // 5. Run scoring engine
  const startedAt = session.started_at ? new Date(session.started_at) : undefined;
  const completedAt = new Date();

  // Inject agnostic configuration from DB if available.
  // IMPORTANT: expected_duration_seconds must be set to avoid UNDETERMINED validity.
  // Spec (migration 20260901000000) defines: expected_duration_seconds: 600 for version 2026.1
  const versionConfig = session.assessment_versions?.config || {};
  const scoringConfig: AssessmentScoringConfig = {
    options_scale: versionConfig.options_scale || { min: 1, max: 5 }, 
    validity_rules: versionConfig.validity_rules || {} // Strict DB driven, NO FALLBACK
  };

  const scoringResult = calculateScoringV1(rawResponses, dimensions, scoringConfig, startedAt, completedAt);

  // 6. Prepare RPC inputs
  const p_dimensions = scoringResult.dimensions.map(d => ({
    dimension_id: d.dimension_id,
    score: d.normalized_score,
  }));

  // Build signals from all dimensions + career readiness + quality
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);
  
  const p_signals = scoringResult.dimensions.map(d => ({
    signal_type: `${d.framework}_${d.code.toLowerCase()}`.replace(/-/g, '_'),
    value: d.normalized_score,
    confidence: scoringResult.quality.score / 100,
    valid_until: validUntil.toISOString(),
  }));

  const p_completion_quality = {
    rate: responses.length / totalQCount,
    missingRate: Math.max(0, 1 - responses.length / totalQCount),
    timeQuality: scoringResult.quality.total_duration_seconds && scoringResult.quality.total_duration_seconds < 300 
      ? "fast" 
      : "normal",
    frameworks: scoringResult.frameworks,
    quality_flags: {
      attention_failures: scoringResult.quality.attention_failures,
      straightline_suspected: scoringResult.quality.straightline_blocks > 0,
      score: scoringResult.quality.score,
    },
  };

  const p_confidence = scoringResult.confidence;

  // 7. Call RPC to atomically save result
  const { data: resultId, error: rpcError } = await supabase.rpc('save_assessment_result', {
    p_session_id: sessionId,
    p_student_id: user.id,
    p_version_id: session.version_id,
    p_scoring_version: session.assessment_versions?.scoring_rules_version || '1.0',
    p_completion_quality: p_completion_quality,
    p_confidence: p_confidence,
    p_dimensions: p_dimensions,
    p_signals: p_signals,
  });

  if (rpcError) {
    console.error("RPC Error saving assessment result:", rpcError);
    return { success: false, error: rpcError.message };
  }

  if (!scoringResult.confidence.is_usable) {
    await trackServerEvent('ASSESSMENT_COMPLETED', {
      assessment_version: session.version_id,
      duration_seconds: scoringResult.quality.total_duration_seconds ?? 0,
      completion_rate: responses.length / totalQCount,
    }, user.id);

    return {
      success: true,
      resultId,
      requiresRetake: true,
      validity: scoringResult.confidence.level,
    };
  }

  // 8. Trigger Profile Builder + Matching Engine (async chain)
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    const profileResult = await buildStudentProfile(user.id, adminClient);
    if (profileResult.success && profileResult.profile) {
      await runMatchingEngine(user.id, profileResult.profile.profile_version, adminClient);
      
      // 9. Generate Report Snapshot
      await generateReportSnapshot(user.id, resultId);
    } else {
      console.error("Profile builder failed:", profileResult.error);
    }
  } catch (matchErr) {
    // Don't fail the whole flow if matching engine has an issue
    console.error("Matching engine or report generation error (non-fatal):", matchErr);
  }

  await trackServerEvent('ASSESSMENT_COMPLETED', {
    assessment_version: session.version_id,
    duration_seconds: scoringResult.quality.total_duration_seconds ?? 0,
    completion_rate: responses.length / totalQCount,
  }, user.id);

  return { 
    success: true, 
    resultId,
  };
}
