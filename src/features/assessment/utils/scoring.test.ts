/**
 * Tests for Assessment Scoring Engine V1.0
 * These tests verify the deterministic math in scoring.ts
 * against the LOCKED SPEC formulas.
 *
 * ARCHITECTURE CONTRACT:
 * - scoring engine: computes normalized_score per dimension, quality flags, validity level
 * - profile-builder: computes stage (STARTING/EXPLORING/CLARIFYING/PLANNING) from normalized score
 * - Tests here ONLY test what scoring engine produces, not what profile-builder derives.
 */
import { expect, test, describe } from 'vitest';
import { calculateScoringV1, type RawResponse, type DimensionMeta } from './scoring';

// Shared test fixtures — mirrors the real DB structure
const makeDim = (id: string, code: string, framework: string, role: string, min: number, max: number): DimensionMeta => ({
  id, code, name: code, framework, raw_min: min, raw_max: max, normalization_formula: '', matching_role: role,
});

// makeDimWithFormula: matches real DB where normalization_formula is used
const makeDimWithFormula = (id: string, code: string, framework: string, role: string, min: number, max: number, formula: string): DimensionMeta => ({
  id, code, name: code, framework, raw_min: min, raw_max: max, normalization_formula: formula, matching_role: role,
});

const makeResponse = (qId: string, qCode: string, dimId: string, fw: string, role: string, value: number, reverse = false): RawResponse => ({
  question_id: qId, question_code: qCode, dimension_id: dimId, framework: fw, matching_role: role,
  is_reverse_scored: reverse, weight: 1.0, response_value: value,
});

// ---------------------------------------------------------------------------
// RIASEC SCORING — Spec: ((raw - 6) / 24) * 100, raw_min=6, raw_max=30, 6 questions
// ---------------------------------------------------------------------------
describe('RIASEC Scoring — ((raw-6)/24)*100 with normalization_formula', () => {
  // Using real DB formula string as it exists in assessment_dimensions
  const dims = [makeDimWithFormula('d-r', 'R', 'riasec', 'primary', 6, 30, '((raw - 6) / 24) * 100')];

  test('All 5s → raw=30 → normalized=100', () => {
    const responses = Array.from({ length: 6 }, (_, i) => makeResponse(`q${i}`, `R0${i+1}`, 'd-r', 'riasec', 'primary', 5));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {}, max_attention_failures_allowed: 1, max_straightline_streak_allowed: 10 } };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.dimensions[0].raw_score).toBe(30);
    expect(result.dimensions[0].normalized_score).toBe(100);
    expect(result.frameworks.riasec['R']).toBe(100);
  });

  test('All 1s → raw=6 → normalized=0', () => {
    const responses = Array.from({ length: 6 }, (_, i) => makeResponse(`q${i}`, `R0${i+1}`, 'd-r', 'riasec', 'primary', 1));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {}, max_attention_failures_allowed: 1, max_straightline_streak_allowed: 10 } };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.dimensions[0].raw_score).toBe(6);
    expect(result.dimensions[0].normalized_score).toBe(0);
  });

  test('All 3s → raw=18 → normalized=50', () => {
    const responses = Array.from({ length: 6 }, (_, i) => makeResponse(`q${i}`, `R0${i+1}`, 'd-r', 'riasec', 'primary', 3));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {}, max_attention_failures_allowed: 1, max_straightline_streak_allowed: 10 } };
    const result = calculateScoringV1(responses, dims, config);
    // ((18-6)/24)*100 = 50
    expect(result.dimensions[0].raw_score).toBe(18);
    expect(result.dimensions[0].normalized_score).toBe(50);
  });

  test('All 4s → raw=24 → normalized=75', () => {
    const responses = Array.from({ length: 6 }, (_, i) => makeResponse(`q${i}`, `R0${i+1}`, 'd-r', 'riasec', 'primary', 4));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {}, max_attention_failures_allowed: 1, max_straightline_streak_allowed: 10 } };
    const result = calculateScoringV1(responses, dims, config);
    // ((24-6)/24)*100 = 75
    expect(result.dimensions[0].raw_score).toBe(24);
    expect(result.dimensions[0].normalized_score).toBe(75);
  });
});

// ---------------------------------------------------------------------------
// BIG FIVE SCORING — uses prefix BF_O, BF_C, BF_E, BF_A, BF_N (matching DB)
// Spec: ((raw - 6) / 24) * 100, 6 questions per trait
// ---------------------------------------------------------------------------
describe('Big Five Scoring — DB key contract BF_O, BF_C, BF_E, BF_A, BF_N', () => {
  const dims = [makeDimWithFormula('d-bfo', 'BF_O', 'big_five', 'secondary', 6, 30, '((raw - 6) / 24) * 100')];

  test('BF_O all 5s → raw=30 → normalized=100', () => {
    const responses = Array.from({ length: 6 }, (_, i) => makeResponse(`q${i}`, `BF_O0${i+1}`, 'd-bfo', 'big_five', 'secondary', 5));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {} } };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.dimensions[0].raw_score).toBe(30);
    expect(result.dimensions[0].normalized_score).toBe(100);
    // key in frameworks is the dimension code: BF_O
    expect(result.frameworks.big_five['BF_O']).toBe(100);
  });

  test('BF_O all 1s → raw=6 → normalized=0', () => {
    const responses = Array.from({ length: 6 }, (_, i) => makeResponse(`q${i}`, `BF_O0${i+1}`, 'd-bfo', 'big_five', 'secondary', 1));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {} } };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.dimensions[0].normalized_score).toBe(0);
    expect(result.frameworks.big_five['BF_O']).toBe(0);
  });

  test('BF_O reverse scored: value=5, reversed → 1, raw=6 → normalized=0', () => {
    // reverse scoring: (max + min) - value = (5 + 1) - 5 = 1
    const responses = Array.from({ length: 6 }, (_, i) => makeResponse(`q${i}`, `BF_O0${i+1}`, 'd-bfo', 'big_five', 'secondary', 5, true));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {} } };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.dimensions[0].raw_score).toBe(6); // 6 × 1 = 6
    expect(result.dimensions[0].normalized_score).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// WORK VALUES SCORING — Spec: ((raw - 5) / 20) * 100, raw_min=5, raw_max=25, 5 questions
// ---------------------------------------------------------------------------
describe('Work Values Scoring — ((raw-5)/20)*100', () => {
  const dims = [makeDimWithFormula('d-wv', 'WV_ACHIEVEMENT', 'work_values', 'secondary', 5, 25, '((raw - 5) / 20) * 100')];

  test('All 5s → raw=25 → normalized=100', () => {
    const responses = Array.from({ length: 5 }, (_, i) => makeResponse(`q${i}`, `WV0${i+1}`, 'd-wv', 'work_values', 'secondary', 5));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {} } };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.dimensions[0].raw_score).toBe(25);
    expect(result.dimensions[0].normalized_score).toBe(100);
  });

  test('All 1s → raw=5 → normalized=0', () => {
    const responses = Array.from({ length: 5 }, (_, i) => makeResponse(`q${i}`, `WV0${i+1}`, 'd-wv', 'work_values', 'secondary', 1));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {} } };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.dimensions[0].raw_score).toBe(5);
    expect(result.dimensions[0].normalized_score).toBe(0);
  });

  test('All 3s → raw=15 → normalized=50', () => {
    const responses = Array.from({ length: 5 }, (_, i) => makeResponse(`q${i}`, `WV0${i+1}`, 'd-wv', 'work_values', 'secondary', 3));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {} } };
    const result = calculateScoringV1(responses, dims, config);
    // ((15-5)/20)*100 = 50
    expect(result.dimensions[0].raw_score).toBe(15);
    expect(result.dimensions[0].normalized_score).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// CAREER READINESS SCORING — Spec: ((raw - 15) / 60) * 100, raw_min=15, raw_max=75, 15 questions
// NOTE: scoring engine outputs normalized_score only.
//       Stage (STARTING/EXPLORING/CLARIFYING/PLANNING) is computed by profile-builder from normalized_score.
// ---------------------------------------------------------------------------
describe('Career Readiness Scoring — ((raw-15)/60)*100, scoring layer only', () => {
  const dims = [makeDimWithFormula('d-cr', 'CR', 'career_readiness', 'readiness', 15, 75, '((raw - 15) / 60) * 100')];

  test('All 5s → raw=75 → normalized=100', () => {
    const responses = Array.from({ length: 15 }, (_, i) => makeResponse(`q${i}`, `CR0${i+1}`, 'd-cr', 'career_readiness', 'readiness', 5));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {} } };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.dimensions[0].raw_score).toBe(75);
    expect(result.dimensions[0].normalized_score).toBe(100);
    // Stage is computed by profile-builder — NOT in scoring engine output
    expect(result.frameworks.career_readiness['CR']).toBe(100);
  });

  test('All 1s → raw=15 → normalized=0', () => {
    const responses = Array.from({ length: 15 }, (_, i) => makeResponse(`q${i}`, `CR0${i+1}`, 'd-cr', 'career_readiness', 'readiness', 1));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {} } };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.dimensions[0].raw_score).toBe(15);
    expect(result.dimensions[0].normalized_score).toBe(0);
    expect(result.frameworks.career_readiness['CR']).toBe(0);
  });

  test('All 3s → raw=45 → normalized=50', () => {
    const responses = Array.from({ length: 15 }, (_, i) => makeResponse(`q${i}`, `CR0${i+1}`, 'd-cr', 'career_readiness', 'readiness', 3));
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {} } };
    const result = calculateScoringV1(responses, dims, config);
    // ((45-15)/60)*100 = 50
    expect(result.dimensions[0].raw_score).toBe(45);
    expect(result.dimensions[0].normalized_score).toBe(50);
    expect(result.frameworks.career_readiness['CR']).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// QUALITY / VALIDITY CHECKS — Spec 08
// NOTE: validity engine in scoring.ts is the AUTHORITATIVE validity engine.
//       validity-evaluator.ts is a standalone utility; tests for it are in remediation.test.ts.
//       The scoring engine (calculateScoringV1) is what runs in production flow.
// ---------------------------------------------------------------------------
describe('Quality / Validity Checks — production validity engine in scoring.ts', () => {
  const dims = [makeDim('d-vq', 'VQ', 'validity', 'quality', 0, 0)];

  test('1 attention check failure → attention_failures=1, score=85, level=QUESTIONABLE', () => {
    const responses = [
      makeResponse('q1', 'VQ_A01', 'd-vq', 'validity', 'quality', 2), // expected 4 → FAIL
    ];
    const config = {
      options_scale: { min: 1, max: 5 },
      validity_rules: {
        expected_answers: { 'VQ_A01': 4 },
        max_attention_failures_allowed: 1,
        max_straightline_streak_allowed: 10,
        expected_duration_seconds: 600
      }
    };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.quality.attention_failures).toBe(1);
    expect(result.quality.score).toBe(85); // 100 - 15
    expect(result.confidence.level).toBe('QUESTIONABLE');
    expect(result.confidence.is_usable).toBe(true); // QUESTIONABLE is usable
  });

  test('2 attention check failures → level=INVALID, is_usable=false', () => {
    const responses = [
      makeResponse('q1', 'VQ_A01', 'd-vq', 'validity', 'quality', 2), // expected 4 → FAIL
      makeResponse('q2', 'VQ_A02', 'd-vq', 'validity', 'quality', 3), // expected 1 → FAIL
    ];
    const config = {
      options_scale: { min: 1, max: 5 },
      validity_rules: {
        expected_answers: { 'VQ_A01': 4, 'VQ_A02': 1 },
        max_attention_failures_allowed: 1,
        max_straightline_streak_allowed: 10,
        expected_duration_seconds: 600
      }
    };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.quality.attention_failures).toBe(2);
    expect(result.confidence.level).toBe('INVALID');
    expect(result.confidence.is_usable).toBe(false);
  });

  test('All attention checks pass → quality score 100, level=VALID', () => {
    const responses = [
      makeResponse('q1', 'VQ_A01', 'd-vq', 'validity', 'quality', 4), // expected 4 ✓
      makeResponse('q2', 'VQ_A02', 'd-vq', 'validity', 'quality', 1), // expected 1 ✓
      makeResponse('q3', 'VQ_A03', 'd-vq', 'validity', 'quality', 5), // expected 5 ✓
    ];
    const config = {
      options_scale: { min: 1, max: 5 },
      validity_rules: {
        expected_answers: { 'VQ_A01': 4, 'VQ_A02': 1, 'VQ_A03': 5 },
        max_attention_failures_allowed: 1,
        max_straightline_streak_allowed: 10,
        expected_duration_seconds: 600
      }
    };
    const result = calculateScoringV1(responses, dims, config);
    expect(result.quality.attention_failures).toBe(0);
    expect(result.quality.score).toBe(100);
    expect(result.confidence.level).toBe('VALID');
    expect(result.confidence.is_usable).toBe(true);
  });

  test('Straight-line ≥8 consecutive (9 items) → straightline_blocks=1, QUESTIONABLE', () => {
    // 9 consecutive same answers → 1 block (≥8 triggers block), streak=9 ≤ max_allowed=10, so QUESTIONABLE not INVALID
    const riasecDim = makeDimWithFormula('d-r', 'R', 'riasec', 'primary', 6, 30, '((raw - 6) / 24) * 100');
    const responses = Array.from({ length: 9 }, (_, i) => makeResponse(`q${i}`, `R0${i+1}`, 'd-r', 'riasec', 'primary', 3));
    const config = {
      options_scale: { min: 1, max: 5 },
      validity_rules: {
        expected_answers: { 'VQ_A01': 4 }, // needs at least one expected_answer to avoid UNDETERMINED
        max_attention_failures_allowed: 1,
        max_straightline_streak_allowed: 10,
        expected_duration_seconds: 600
      }
    };
    const result = calculateScoringV1(responses, [riasecDim], config);
    // 9 consecutive same → 1 block triggered at index 8
    expect(result.quality.straightline_blocks).toBe(1);
    expect(result.quality.score).toBe(85); // 100 - 15
    // streak=9 ≤ max_allowed_streak=10 → not INVALID, but 1 block → QUESTIONABLE
    expect(result.confidence.level).toBe('QUESTIONABLE');
  });

  test('Straight-line > max_allowed_streak (12 > 10) → INVALID', () => {
    // 12 consecutive same → max_streak_reached=12 > max_allowed=10 → INVALID
    const riasecDim = makeDimWithFormula('d-r', 'R', 'riasec', 'primary', 6, 30, '((raw - 6) / 24) * 100');
    const responses = Array.from({ length: 12 }, (_, i) => makeResponse(`q${i}`, `R0${i+1}`, 'd-r', 'riasec', 'primary', 3));
    const config = {
      options_scale: { min: 1, max: 5 },
      validity_rules: {
        expected_answers: { 'VQ_A01': 4 },
        max_attention_failures_allowed: 1,
        max_straightline_streak_allowed: 10,
        expected_duration_seconds: 600
      }
    };
    const result = calculateScoringV1(responses, [riasecDim], config);
    expect(result.quality.straightline_blocks).toBeGreaterThanOrEqual(1);
    expect(result.confidence.level).toBe('INVALID');
    expect(result.confidence.is_usable).toBe(false);
  });

  test('No validity_rules.expected_answers AND no expected_duration → UNDETERMINED', () => {
    const responses = [makeResponse('q1', 'R01', 'd-r', 'riasec', 'primary', 3)];
    const riasecDim = makeDim('d-r', 'R', 'riasec', 'primary', 6, 30);
    const config = {
      options_scale: { min: 1, max: 5 },
      validity_rules: { expected_answers: {} } // no expected_duration_seconds either
    };
    const result = calculateScoringV1(responses, [riasecDim], config);
    expect(result.confidence.level).toBe('UNDETERMINED');
    expect(result.confidence.is_usable).toBeNull();
  });

  test('Validity precedence: INVALID > QUESTIONABLE (2 attn failures beats straight-line)', () => {
    const riasecDim = makeDimWithFormula('d-r', 'R', 'riasec', 'primary', 6, 30, '((raw - 6) / 24) * 100');
    const validityDim = makeDim('d-vq', 'VQ', 'validity', 'quality', 0, 0);
    const responses = [
      // 8 consecutive straights → QUESTIONABLE from straight-line
      ...Array.from({ length: 8 }, (_, i) => makeResponse(`r${i}`, `R0${i}`, 'd-r', 'riasec', 'primary', 3)),
      // 2 attention failures → INVALID
      makeResponse('q1', 'VQ_A01', 'd-vq', 'validity', 'quality', 2), // expected 4
      makeResponse('q2', 'VQ_A02', 'd-vq', 'validity', 'quality', 3), // expected 1
    ];
    const config = {
      options_scale: { min: 1, max: 5 },
      validity_rules: {
        expected_answers: { 'VQ_A01': 4, 'VQ_A02': 1 },
        max_attention_failures_allowed: 1,
        max_straightline_streak_allowed: 10,
        expected_duration_seconds: 600
      }
    };
    const result = calculateScoringV1(responses, [riasecDim, validityDim], config);
    // INVALID takes precedence
    expect(result.confidence.level).toBe('INVALID');
  });
});

// ---------------------------------------------------------------------------
// RIASEC FRAMEWORK OUTPUT — verify keys are single letter codes (R, I, A, etc.)
// ---------------------------------------------------------------------------
describe('RIASEC Framework Output Keys', () => {
  test('Scoring output uses single letter RIASEC codes as framework keys', () => {
    const dims = [
      makeDimWithFormula('d-r', 'R', 'riasec', 'primary', 6, 30, '((raw - 6) / 24) * 100'),
      makeDimWithFormula('d-i', 'I', 'riasec', 'primary', 6, 30, '((raw - 6) / 24) * 100'),
      makeDimWithFormula('d-a', 'A', 'riasec', 'primary', 6, 30, '((raw - 6) / 24) * 100'),
    ];
    const responses = [
      ...Array.from({ length: 6 }, (_, i) => makeResponse(`r${i}`, `R0${i}`, 'd-r', 'riasec', 'primary', 2)), // R: low
      ...Array.from({ length: 6 }, (_, i) => makeResponse(`i${i}`, `I0${i}`, 'd-i', 'riasec', 'primary', 5)), // I: 100
      ...Array.from({ length: 6 }, (_, i) => makeResponse(`a${i}`, `A0${i}`, 'd-a', 'riasec', 'primary', 4)), // A: 75
    ];
    const config = { options_scale: { min: 1, max: 5 }, validity_rules: { expected_answers: {} } };
    const result = calculateScoringV1(responses, dims, config);
    // primary_code is NOT generated by scoring engine (it's in profile-builder)
    expect((result.frameworks.riasec as any).primary_code).toBeUndefined();
    // scores are present and correct
    // R: all 2s → raw=12 → ((12-6)/24)*100 = 25
    expect(result.frameworks.riasec['R']).toBe(25);
    expect(result.frameworks.riasec['I']).toBe(100);
    expect(result.frameworks.riasec['A']).toBe(75);
  });
});
