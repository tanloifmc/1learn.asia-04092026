/**
 * ASSESSMENT SCORING ENGINE — V1.0 LOCKED SPEC
 * 
 * RULES:
 * - Deterministic Math, no LLM.
 * - Framework agnostic scoring and validity detection.
 */

export interface ScoredDimension {
  dimension_id: string;
  code: string;
  framework: string;
  name: string;
  raw_score: number;
  normalized_score: number;
  raw_min: number;
  raw_max: number;
  matching_role: string;
}

export interface QualityFlags {
  attention_failures: number;
  consistency_failures: number;
  straightline_blocks: number;
  speeding_percentage: number | null;
  total_duration_seconds: number | null;
  score: number;
}

export interface ConfidenceResult {
  score: number;
  level: 'VALID' | 'QUESTIONABLE' | 'INVALID' | 'UNDETERMINED';
  is_usable: boolean | null; // null means undetermined
  flags: string[];
}

export interface ScoringResult {
  dimensions: ScoredDimension[];
  frameworks: Record<string, Record<string, number>>;
  quality: QualityFlags;
  confidence: ConfidenceResult;
}

export interface RawResponse {
  question_id: string;
  question_code: string;
  dimension_id: string;
  framework: string;
  matching_role: string;
  is_reverse_scored: boolean;
  weight: number;
  response_value: number;
}

export interface DimensionMeta {
  id: string;
  code: string;
  name: string;
  framework: string;
  raw_min: number;
  raw_max: number;
  normalization_formula: string;
  matching_role: string;
}

export interface AssessmentScoringConfig {
  options_scale: { min: number; max: number };
  validity_rules?: {
    expected_answers?: Record<string, number>;
    max_attention_failures_allowed?: number;
    straightline_block_threshold?: number;
    expected_duration_seconds?: number;
  };
}

function parseAndCalculateFormula(formula: string, raw: number, min: number, max: number): number {
  if (!formula) return 0;
  
  // Replace variables in formula with actual numbers
  const expression = formula
    .replace(/raw_min/g, min.toString())
    .replace(/raw_max/g, max.toString())
    .replace(/raw/g, raw.toString());
  
  // Safe validation: Only allow digits, whitespace, and basic math operators + - * / ( ) .
  if (!/^[\d\s\+\-\*\/\(\)\.]+$/.test(expression)) {
    console.error("Invalid characters in formula:", formula);
    console.error("Expression was:", expression);
    return 0;
  }
  
  try {
    const result = new Function("return " + expression)();
    if (typeof result !== 'number' || isNaN(result)) return 0;
    return Math.max(0, Math.min(100, Math.round(result)));
  } catch (e) {
    return 0;
  }
}

export function calculateScoringV1(
  responses: RawResponse[],
  dimensions: DimensionMeta[],
  config: AssessmentScoringConfig,
  startedAt?: Date,
  completedAt?: Date
): ScoringResult {
  const scorableResponses = responses.filter(r => r.matching_role !== 'quality');

  const dimRaw: Record<string, number> = {};
  for (const dim of dimensions) {
    if (dim.matching_role === 'quality') continue;
    dimRaw[dim.id] = 0;
  }

  // Calculate raw scores with reverse scoring
  for (const r of scorableResponses) {
    if (!(r.dimension_id in dimRaw)) continue;
    let val = r.response_value;
    if (r.is_reverse_scored) {
      val = (config.options_scale.max + config.options_scale.min) - val;
    }
    dimRaw[r.dimension_id] += val * r.weight;
  }

  const scoredDimensions: ScoredDimension[] = [];
  const frameworks: Record<string, Record<string, number>> = {};

  for (const dim of dimensions) {
    if (dim.matching_role === 'quality') continue;
    
    const raw = dimRaw[dim.id] ?? 0;
    const min = dim.raw_min ?? 0;
    const max = dim.raw_max ?? 0;
    
    let normalized = 0;
    if (dim.normalization_formula) {
      normalized = parseAndCalculateFormula(dim.normalization_formula, raw, min, max);
    } else if (max && max > min) {
      normalized = ((raw - min) / (max - min)) * 100;
      normalized = Math.max(0, Math.min(100, Math.round(normalized)));
    }
    
    scoredDimensions.push({
      dimension_id: dim.id,
      code: dim.code,
      framework: dim.framework,
      name: dim.name,
      raw_score: raw,
      normalized_score: normalized,
      raw_min: min,
      raw_max: max,
      matching_role: dim.matching_role,
    });

    if (!frameworks[dim.framework]) {
      frameworks[dim.framework] = {};
    }
    frameworks[dim.framework][dim.code] = normalized;
  }

  // --- Quality Control (Validity VQ) ---
  let attention_failures = 0;
  const expectedAnswers = config.validity_rules?.expected_answers || {};
  const validityResponses = responses.filter(r => r.matching_role === 'quality');
  
  for (const r of validityResponses) {
    if (r.question_code in expectedAnswers) {
      if (r.response_value !== expectedAnswers[r.question_code]) {
        attention_failures++;
      }
    }
  }

  // Straight-line blocks check
  let straightline_blocks = 0;
  let current_streak = 1;
  let in_block = false;
  let max_streak_reached = 0;
  const straightlineBlockThreshold = config.validity_rules?.straightline_block_threshold;
  const hasStraightlineThreshold = Number.isInteger(straightlineBlockThreshold)
    && (straightlineBlockThreshold ?? 0) >= 2;
  
  const allValues = scorableResponses.map(r => r.response_value);
  for (let i = 1; i < allValues.length; i++) {
    if (allValues[i] === allValues[i - 1]) {
      current_streak++;
      if (current_streak > max_streak_reached) max_streak_reached = current_streak;
      
      if (hasStraightlineThreshold && current_streak >= straightlineBlockThreshold! && !in_block) {
        straightline_blocks++;
        in_block = true;
      }
    } else {
      current_streak = 1;
      in_block = false;
    }
  }

  // Duration & Speeding
  let total_duration_seconds = null;
  let speeding_percentage = null;
  
  if (startedAt && completedAt) {
    total_duration_seconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000);
    const expected_duration = config.validity_rules?.expected_duration_seconds;
    if (expected_duration && expected_duration > 0) {
      // If completed faster than expected, calculate speeding percentage
      // For example, if expected is 100s, and we took 60s, speeding is 40%.
      // We limit to 0-100%
      if (total_duration_seconds < expected_duration) {
         speeding_percentage = ((expected_duration - total_duration_seconds) / expected_duration) * 100;
         speeding_percentage = Math.round(speeding_percentage);
      } else {
         speeding_percentage = 0;
      }
    }
  }

  // Quality Score (legacy metric)
  let quality_score = 100;
  quality_score -= attention_failures * 15;
  if (straightline_blocks > 0) quality_score -= 15;
  quality_score = Math.max(0, quality_score);

  const flags: string[] = [];
  if (attention_failures > 0) flags.push('ATTENTION_FAIL');
  if (straightline_blocks > 0) flags.push('STRAIGHT_LINE');

  // --- Spec 08 Validity Evaluator ---
  let level: 'VALID' | 'QUESTIONABLE' | 'INVALID' | 'UNDETERMINED' = 'VALID';
  
  // Every validity signal requires explicit package metadata. Do not silently fall back to a default.
  const hasDuration = config.validity_rules?.expected_duration_seconds !== undefined && config.validity_rules.expected_duration_seconds > 0;
  const hasExpectedAnswers = config.validity_rules?.expected_answers && Object.keys(config.validity_rules.expected_answers).length > 0;
  const hasMissingMetadata = !hasDuration || !hasExpectedAnswers || !hasStraightlineThreshold;

  if (hasMissingMetadata) {
    level = 'UNDETERMINED';
  } else {
    // Precedence: INVALID > QUESTIONABLE > VALID
    let isInvalid = false;
    let isQuestionable = false;

    if (attention_failures >= 2) isInvalid = true;
    else if (attention_failures === 1) isQuestionable = true;

    if (straightline_blocks >= 2) isInvalid = true;
    else if (straightline_blocks === 1) isQuestionable = true;

    if (speeding_percentage !== null) {
      if (speeding_percentage >= 40) isInvalid = true;
      else if (speeding_percentage >= 20) isQuestionable = true;
    }

    if (isInvalid) level = 'INVALID';
    else if (isQuestionable) level = 'QUESTIONABLE';
  }

  let is_usable: boolean | null = null;
  if (level === 'UNDETERMINED') {
    is_usable = null;
  } else {
    is_usable = level !== 'INVALID';
  }

  return {
    dimensions: scoredDimensions,
    frameworks,
    quality: {
      attention_failures,
      consistency_failures: 0,
      straightline_blocks,
      speeding_percentage,
      total_duration_seconds,
      score: quality_score,
    },
    confidence: {
      score: quality_score / 100,
      level,
      is_usable,
      flags
    }
  };
}
