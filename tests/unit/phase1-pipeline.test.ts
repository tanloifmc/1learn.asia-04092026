import { describe, it, expect } from 'vitest';
import { calculateScoringV1, RawResponse, DimensionMeta, AssessmentScoringConfig } from '../../src/features/assessment/utils/scoring';
import { interpretProfile } from '../../src/features/career/actions/interpretation-engine';
import { buildReportData } from '../../src/features/career/actions/report-builder';

describe('Phase 1 Pipeline Tests', () => {
  const dimensions: DimensionMeta[] = [
    { id: 'dim_r', code: 'R', name: 'Realistic', framework: 'riasec', raw_min: 6, raw_max: 30, normalization_formula: '((raw - 6) / 24) * 100', matching_role: 'primary' },
    { id: 'dim_i', code: 'I', name: 'Investigative', framework: 'riasec', raw_min: 6, raw_max: 30, normalization_formula: '((raw - 6) / 24) * 100', matching_role: 'primary' },
    { id: 'dim_o', code: 'O', name: 'Openness', framework: 'big_five', raw_min: 6, raw_max: 30, normalization_formula: '((raw - 6) / 24) * 100', matching_role: 'secondary' },
    { id: 'dim_vq', code: 'VQ', name: 'Validity', framework: 'validity', raw_min: 0, raw_max: 0, normalization_formula: '', matching_role: 'quality' }
  ];

  const config: AssessmentScoringConfig = {
    options_scale: { min: 1, max: 5 },
    validity_rules: {
      expected_answers: { 'VQ_A01': 4, 'VQ_A02': 1 },
      max_attention_failures_allowed: 1,
      straightline_block_threshold: 8,
      expected_duration_seconds: 600
    }
  };

  it('1. Reverse scoring & Normalization & Dimension split (RIASEC vs Big Five)', () => {
    const responses: RawResponse[] = [
      { question_id: 'q1', question_code: 'Q1', dimension_id: 'dim_r', framework: 'riasec', matching_role: 'primary', is_reverse_scored: false, weight: 1, response_value: 5 }, // 5
      { question_id: 'q2', question_code: 'Q2', dimension_id: 'dim_r', framework: 'riasec', matching_role: 'primary', is_reverse_scored: true, weight: 1, response_value: 5 },  // (5+1) - 5 = 1
      { question_id: 'q3', question_code: 'Q3', dimension_id: 'dim_i', framework: 'riasec', matching_role: 'primary', is_reverse_scored: false, weight: 1, response_value: 3 },
      { question_id: 'q4', question_code: 'Q4', dimension_id: 'dim_o', framework: 'big_five', matching_role: 'secondary', is_reverse_scored: false, weight: 1, response_value: 4 }
    ];

    const result = calculateScoringV1(responses, dimensions, config);

    // dim_r raw: 5 + 1 = 6
    const dimR = result.dimensions.find(d => d.code === 'R');
    expect(dimR?.raw_score).toBe(6);
    // formula: ((6 - 6) / 24) * 100 = 0
    expect(dimR?.normalized_score).toBe(0);

    expect(result.frameworks.riasec).toBeDefined();
    expect(result.frameworks.big_five).toBeDefined();
    
    // RIASEC is not mixed with Big Five
    expect(result.frameworks.riasec['R']).toBe(0);
    expect(result.frameworks.riasec['O']).toBeUndefined();
    expect(result.frameworks.big_five['O']).toBeDefined();
  });

  it('2. VQ invalid -> Profile usable false', () => {
    const responses: RawResponse[] = [
      // attention checks expected: VQ_A01=4
      { question_id: 'q_vq1', question_code: 'VQ_A01', dimension_id: 'dim_vq', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 1 },
      { question_id: 'q_vq2', question_code: 'VQ_A02', dimension_id: 'dim_vq', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 2 },
    ];
    const result = calculateScoringV1(responses, dimensions, config);
    expect(result.quality.attention_failures).toBeGreaterThan(0);
    expect(result.confidence.is_usable).toBe(false);
  });

  it('3. Validity UNDETERMINED when BOTH expected_answers AND expected_duration_seconds are absent', () => {
    const responses: RawResponse[] = [
      { question_id: 'q_vq1', question_code: 'VQ_A01', dimension_id: 'dim_vq', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 1 },
    ];
    // UNDETERMINED requires: expected_answers = {} (empty) AND no expected_duration_seconds
    // Having expected_answers populated means engine can determine quality → not UNDETERMINED
    const configUndetermined: AssessmentScoringConfig = {
      options_scale: { min: 1, max: 5 },
      validity_rules: {
        expected_answers: {}, // empty → hasExpectedAnswers=false
        // no expected_duration_seconds → hasDuration=false
        // hasMissingMetadata = !hasDuration && !hasExpectedAnswers = true → UNDETERMINED
      }
    };
    const result = calculateScoringV1(responses, dimensions, configUndetermined);
    expect(result.confidence.is_usable).toBeNull();
    expect(result.confidence.level).toBe('UNDETERMINED');
  });

  it('4. Interpretation determinism & Report Schema — BF_ key contract', () => {
    const profileFeatures = {
      interests: {
        framework: 'riasec',
        scores: { 'R': 85, 'I': 90, 'A': 30, 'S': 40, 'E': 60, 'C': 70 },
        primary_code: 'IRC',
        ranked_dimensions: ['I', 'R', 'C', 'E', 'S', 'A'] // sorted by score desc
      },
      personality: {
        framework: 'big_five',
        // Use BF_ prefixed keys matching DB contract (assessment_dimensions.code)
        // BF_O=80 (high), BF_C=90 (very high), BF_E=30 (low), BF_A=60, BF_N=20
        scores: { 'BF_O': 80, 'BF_C': 90, 'BF_E': 30, 'BF_A': 60, 'BF_N': 20 }
      },
      work_values: {
        framework: 'work_values',
        scores: { 'WV_ACHIEVEMENT': 70 }
      },
      meta: { validity: 'VALID', source_assessments: ['v1'] }
    } as any;

    const interpretation1 = interpretProfile(profileFeatures);
    const interpretation2 = interpretProfile(profileFeatures);
    expect(interpretation1).toEqual(interpretation2); // deterministic

    const report = buildReportData('student-1', 'assessment-1', profileFeatures);
    expect(report.userId).toBe('student-1');
    expect(report.executiveSnapshot.deterministicSummary[0]).toContain('IRC');
    expect(report.riasec.dimensions.length).toBe(6);

    // With BF_ keys, traits are mapped: BF_C=90 → PROMINENT, BF_O=80 → may be PROMINENT
    // report-builder strips BF_ prefix: trait.code.replace('BF_', '') → 'C', 'O', 'E', 'A', 'N'
    // BigFiveCard uses trait code 'C', 'O' etc.
    // workingStyle is computed from trait C and O — should be non-null if personality has valid BF_ data
    // Working style and interaction style are now decoupled from builder and returned as null from engine
    expect(report.bigFive.traits.length).toBeGreaterThan(0);
    expect(report.bigFive.workingStyle).toBeNull();
    
    expect(report.bigFive.interactionStyle).toBeNull();

    // No fake data
    expect(report.careerExploration.data).toEqual([]);
    expect(report.majorExploration.data).toEqual([]);
  });
});
