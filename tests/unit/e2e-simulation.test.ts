
import { describe, it, expect } from 'vitest';
import { calculateScoringV1, RawResponse, DimensionMeta } from '../../src/features/assessment/utils/scoring';
import { interpretProfile } from '../../src/features/career/actions/interpretation-engine';
import { buildReportData } from '../../src/features/career/actions/report-builder';

describe('E2E SIMULATION PHASE 1', () => {
  it('Simulates full flow', () => {
    // 1. Dimensions
    const dimensions: DimensionMeta[] = [
      { id: '1', code: 'R', name: 'Realistic', framework: 'riasec', raw_min: 6, raw_max: 30, normalization_formula: '((raw - 6) / 24) * 100', matching_role: 'primary' },
      { id: '2', code: 'I', name: 'Investigative', framework: 'riasec', raw_min: 6, raw_max: 30, normalization_formula: '((raw - 6) / 24) * 100', matching_role: 'primary' },
      { id: '3', code: 'A', name: 'Artistic', framework: 'riasec', raw_min: 6, raw_max: 30, normalization_formula: '((raw - 6) / 24) * 100', matching_role: 'primary' },
      { id: '4', code: 'S', name: 'Social', framework: 'riasec', raw_min: 6, raw_max: 30, normalization_formula: '((raw - 6) / 24) * 100', matching_role: 'primary' },
      { id: '5', code: 'E', name: 'Enterprising', framework: 'riasec', raw_min: 6, raw_max: 30, normalization_formula: '((raw - 6) / 24) * 100', matching_role: 'primary' },
      { id: '6', code: 'C', name: 'Conventional', framework: 'riasec', raw_min: 6, raw_max: 30, normalization_formula: '((raw - 6) / 24) * 100', matching_role: 'primary' },
      { id: '7', code: 'O', name: 'Openness', framework: 'big_five', raw_min: 6, raw_max: 30, normalization_formula: '((raw - 6) / 24) * 100', matching_role: 'secondary' },
      { id: '8', code: 'VQ', name: 'Validity', framework: 'validity', raw_min: 0, raw_max: 0, normalization_formula: '', matching_role: 'quality' },
      { id: '9', code: 'ACHIEVEMENT', name: 'Achievement', framework: 'work_values', raw_min: 5, raw_max: 25, normalization_formula: '((raw - 5) / 20) * 100', matching_role: 'secondary' },
    ];

    // 2. Responses
    const responses: RawResponse[] = [
      { question_id: 'q1', question_code: 'Q1', dimension_id: '1', framework: 'riasec', matching_role: 'primary', is_reverse_scored: false, weight: 1, response_value: 5 },
      { question_id: 'q2', question_code: 'Q2', dimension_id: '2', framework: 'riasec', matching_role: 'primary', is_reverse_scored: false, weight: 1, response_value: 5 },
      { question_id: 'q3', question_code: 'Q3', dimension_id: '7', framework: 'big_five', matching_role: 'secondary', is_reverse_scored: false, weight: 1, response_value: 1 },
      { question_id: 'q4', question_code: 'VQ_A01', dimension_id: '8', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 4 }, // pass attention check
      { question_id: 'q5', question_code: 'Q5', dimension_id: '9', framework: 'work_values', matching_role: 'secondary', is_reverse_scored: false, weight: 1, response_value: 5 },
    ];

    console.log('--- 1. SCORING ---');
    const scoringResult = calculateScoringV1(responses, dimensions, { options_scale: { min: 1, max: 5 } });
    console.log(JSON.stringify(scoringResult.frameworks, null, 2));
    console.log('Validity Usable:', scoringResult.confidence.is_usable);

    console.log('\n--- 2. UNIFIED PROFILE ---');
    // Mocking the profile builder fetching from DB, we use scoringResult directly
    const profileFeatures = {
      interests: {
        framework: 'riasec',
        scores: { R: 85, I: 92, A: 30, S: 40, E: 60, C: 70 },
        primary_code: 'IRC'
      },
      personality: {
        framework: 'big_five',
        scores: { O: 80, C: 90, E: 30, A: 60, N: 20 } // O: 80 -> highly_open
      },
      work_values: {
        framework: 'work_values',
        scores: { ACHIEVEMENT: 90, INDEPENDENCE: 80, RECOGNITION: 70, RELATIONSHIPS: 60, SUPPORT: 50, CONDITIONS: 40 }
      },
      meta: { validity: 'VALID', source_assessments: ['v1'] }
    } as any;
    profileFeatures.interests.ranked_dimensions = ['I', 'R', 'C', 'E', 'S', 'A'];
    console.log('Profile Interests Primary Code:', profileFeatures.interests.primary_code);

    console.log('\n--- 3. INTERPRETATION ---');
    const interpretation = interpretProfile(profileFeatures);
    console.log('Interests Primary Traits Count:', interpretation.interests.primary.length);
    console.log('Personality Traits Count:', interpretation.personality.length);

    console.log('\n--- 4. REPORT DATA ---');
    const report = buildReportData('TEST_STUDENT_ID', 'a1', profileFeatures);
    console.log(JSON.stringify(report, null, 2));
    
    expect(report.userId).toBe('TEST_STUDENT_ID');
    expect(report.executiveSnapshot.deterministicSummary[0]).toContain('IRC');
    expect(report.riasec.dimensions.length).toBe(6);
  });
});
