import { describe, it, expect } from 'vitest';
import { calculateScoringV1, DimensionMeta, RawResponse } from '../../src/features/assessment/utils/scoring';
import { interpretProfile, calculateHollandCode } from '../../src/features/career/actions/interpretation-engine';

describe('PHASE C: INDEPENDENT GOLDEN TESTS (Spec 07 Truth)', () => {
  const config = {
    options_scale: { min: 1, max: 5 },
    validity_rules: {
      expected_answers: { "VQ_A01": 4, "VQ_A02": 1, "VQ_A03": 5 },
      max_attention_failures_allowed: 1,
      max_straightline_streak_allowed: 12,
      expected_duration_seconds: 600
    }
  };

  const startedAt = new Date("2026-09-02T10:00:00Z");
  const completedAt = new Date("2026-09-02T10:15:00Z"); // 15 mins (900s) > 600s -> Not speeding

  const generateResponses = (values: Record<string, number>): RawResponse[] => {
    return Object.entries(values).map(([code, val]) => ({
      question_id: `q_${code}`,
      question_code: code,
      dimension_id: `dim_${code.split('_')[0]}`,
      framework: code.split('_')[0].toLowerCase(),
      matching_role: code.startsWith('VQ') ? 'quality' : 'primary',
      is_reverse_scored: code.includes('_REV_'), // convention for testing
      weight: 1,
      response_value: val
    }));
  };

  const generateDims = (framework: string, codes: string[], min: number, max: number): DimensionMeta[] => {
    return codes.map(c => ({
      id: `dim_${framework}_${c}`,
      code: c,
      name: c,
      framework: framework.toLowerCase(),
      raw_min: min,
      raw_max: max,
      normalization_formula: `((raw - ${min}) / (${max} - ${min})) * 100`,
      matching_role: 'primary'
    }));
  };

  describe('Methodology 1: RIASEC / Holland', () => {
    const dims = generateDims('RIASEC', ['R', 'I', 'A', 'S', 'E', 'C'], 6, 30);
    
    it('Canonical Tie-Break: R > I > A > S > E > C', () => {
      // 36 responses, all 5s. Raw = 30 for all.
      // Expected normalized = 100 for all.
      // Tie-break should produce R, I, A as primary code.
      const responses: RawResponse[] = [];
      for (const d of dims) {
        for (let i=0; i<6; i++) {
          responses.push({
            question_id: `q_${d.code}_${i}`,
            question_code: `${d.code}_${i}`,
            dimension_id: d.id,
            framework: 'riasec',
            matching_role: 'primary',
            is_reverse_scored: false,
            weight: 1,
            response_value: 5
          });
        }
      }

      const result = calculateScoringV1(responses, dims, config, startedAt, completedAt);
      expect(result.frameworks['riasec']['R']).toBe(100);
      expect(result.frameworks['riasec']['I']).toBe(100);
      expect(result.frameworks['riasec']['A']).toBe(100);
      expect(result.frameworks['riasec']['S']).toBe(100);
      expect(result.frameworks['riasec']['E']).toBe(100);
      expect(result.frameworks['riasec']['C']).toBe(100);

      const hc = calculateHollandCode(result.frameworks['riasec']);
      expect(hc.primary_code).toBe('RIA');
      expect(hc.ranked_dimensions).toEqual(['R', 'I', 'A', 'S', 'E', 'C']);
    });
  });

  describe('Methodology 2: Big Five / OCEAN', () => {
    const dims = generateDims('BIG_FIVE', ['BF_O', 'BF_C', 'BF_E', 'BF_A', 'BF_N'], 6, 30);
    
    it('Reverse Scoring & Classification Boundaries', () => {
      const responses: RawResponse[] = [];
      // Let's create an exact scenario:
      // O: 6 normal items, answered 5 => 30 => Norm 100
      // C: 6 reversed items, answered 5 => 6 * (5+1 - 5) = 6 => Norm 0
      // E: 6 normal items, answered 3 => 18 => Norm 50
      // A: 6 normal items, answered 3 => 18 => Norm 50
      // N: 6 normal items, answered 3 => 18 => Norm 50
      // Mean normalized = (100 + 0 + 50 + 50 + 50) / 5 = 50
      // O diff = +50 >= 10 => PROMINENT
      // C diff = -50 <= -10 => LOWER
      // E, A, N diff = 0 => MODERATE

      for (const d of dims) {
        for (let i=0; i<6; i++) {
          let val = 3;
          let rev = false;
          if (d.code === 'BF_O') val = 5;
          if (d.code === 'BF_C') { val = 5; rev = true; } // reverse
          
          responses.push({
            question_id: `q_${d.code}_${i}`,
            question_code: `${d.code}_${i}`,
            dimension_id: d.id,
            framework: 'big_five',
            matching_role: 'primary',
            is_reverse_scored: rev,
            weight: 1,
            response_value: val
          });
        }
      }

      const result = calculateScoringV1(responses, dims, config, startedAt, completedAt);
      expect(result.frameworks['big_five']['BF_O']).toBe(100);
      expect(result.frameworks['big_five']['BF_C']).toBe(0);
      expect(result.frameworks['big_five']['BF_E']).toBe(50);
      expect(result.frameworks['big_five']['BF_A']).toBe(50);
      expect(result.frameworks['big_five']['BF_N']).toBe(50);

      const interpreted = interpretProfile({
        personality: { scores: result.frameworks['big_five'] }
      });

      const o = interpreted.personality.find(t => t.code === 'BF_O');
      const c = interpreted.personality.find(t => t.code === 'BF_C');
      const e = interpreted.personality.find(t => t.code === 'BF_E');

      expect(o?.level).toBe('prominent');
      expect(c?.level).toBe('lower');
      expect(e?.level).toBe('moderate');
    });
  });

  describe('Methodology 3: Work Values / Super', () => {
    // 6 dimensions, 5 items each (30 items total). Min 5, Max 25.
    const dims = generateDims('WORK_VALUES', ['ACHIEVEMENT', 'INDEPENDENCE', 'RECOGNITION', 'RELATIONSHIPS', 'SUPPORT', 'WORKING_CONDITIONS'], 5, 25);
    
    it('Normalizes correctly and allows sorting', () => {
      const responses: RawResponse[] = [];
      for (const d of dims) {
        for (let i=0; i<5; i++) {
          responses.push({
            question_id: `q_${d.code}_${i}`,
            question_code: `${d.code}_${i}`,
            dimension_id: d.id,
            framework: 'work_values',
            matching_role: 'primary',
            is_reverse_scored: false,
            weight: 1,
            response_value: 5
          });
        }
      }
      const result = calculateScoringV1(responses, dims, config, startedAt, completedAt);
      // Raw 25 => Norm 100
      expect(result.frameworks['work_values']['ACHIEVEMENT']).toBe(100);
    });
  });

  describe('Methodology 4: Career Readiness', () => {
    const dims = generateDims('CAREER_READINESS', ['CR'], 15, 75);
    
    it('Scores max (75) to 100', () => {
      const responses: RawResponse[] = [];
      for (let i=0; i<15; i++) {
        responses.push({
          question_id: `q_cr_${i}`,
          question_code: `CR_${i}`,
          dimension_id: dims[0].id,
          framework: 'career_readiness',
          matching_role: 'primary',
          is_reverse_scored: false,
          weight: 1,
          response_value: 5
        });
      }
      const result = calculateScoringV1(responses, dims, config, startedAt, completedAt);
      expect(result.frameworks['career_readiness']['CR']).toBe(100);
    });
  });

  describe('Methodology 5: Validity / Quality Control', () => {
    it('Precedence Rule: Invalid due to attention check fails overrides others', () => {
      const responses = [
        { question_id: '1', question_code: 'VQ_A01', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 1 }, // Fail (expected 4)
        { question_id: '2', question_code: 'VQ_A02', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 5 }, // Fail (expected 1)
        { question_id: '3', question_code: 'VQ_A03', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 5 } // Pass
      ];

      // Also simulate a good duration
      const result = calculateScoringV1(responses, [], config, startedAt, completedAt);
      expect(result.quality.attention_failures).toBe(2);
      expect(result.confidence.level).toBe('INVALID');
    });
    
    it('Questionable due to 1 attention fail', () => {
      const responses = [
        { question_id: '1', question_code: 'VQ_A01', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 1 }, // Fail
        { question_id: '2', question_code: 'VQ_A02', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 1 }, // Pass
        { question_id: '3', question_code: 'VQ_A03', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 5 } // Pass
      ];
      const result = calculateScoringV1(responses, [], config, startedAt, completedAt);
      expect(result.confidence.level).toBe('QUESTIONABLE');
    });

    it('Speeding alone >= 40% causes INVALID', () => {
      const responses = [
        { question_id: '1', question_code: 'VQ_A01', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 4 }, // Pass
        { question_id: '2', question_code: 'VQ_A02', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 1 }, // Pass
        { question_id: '3', question_code: 'VQ_A03', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 5 } // Pass
      ];
      // Expected duration = 600s. Speeding >= 40% means completed in <= 360s.
      // Let's do 300s. (600 - 300) / 600 = 50% speeding -> INVALID
      const fastCompletedAt = new Date("2026-09-02T10:05:00Z"); // 5 mins = 300s
      const result = calculateScoringV1(responses, [], config, startedAt, fastCompletedAt);
      expect(result.confidence.level).toBe('INVALID');
    });

    it('Speeding alone >= 20% causes QUESTIONABLE', () => {
      const responses = [
        { question_id: '1', question_code: 'VQ_A01', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 4 }, // Pass
        { question_id: '2', question_code: 'VQ_A02', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 1 }, // Pass
        { question_id: '3', question_code: 'VQ_A03', dimension_id: 'q', framework: 'validity', matching_role: 'quality', is_reverse_scored: false, weight: 1, response_value: 5 } // Pass
      ];
      // Expected duration = 600s. Speeding >= 20% means completed in <= 480s.
      // Let's do 450s. (600 - 450) / 600 = 25% speeding -> QUESTIONABLE
      const fastCompletedAt = new Date("2026-09-02T10:07:30Z"); // 7.5 mins = 450s
      const result = calculateScoringV1(responses, [], config, startedAt, fastCompletedAt);
      expect(result.confidence.level).toBe('QUESTIONABLE');
    });

    it('Straight-lining >= 12 causes QUESTIONABLE (does not automatically invalidate)', () => {
      const responses: RawResponse[] = [];
      // 13 same answers in a row = max_allowed_streak(12) exceeded -> QUESTIONABLE
      for (let i = 0; i < 13; i++) {
        responses.push({ question_id: `q${i}`, question_code: `R_${i}`, dimension_id: 'd', framework: 'riasec', matching_role: 'primary', is_reverse_scored: false, weight: 1, response_value: 3 });
      }
      const resultQuestionable = calculateScoringV1(responses, [], config, startedAt, completedAt);
      expect(resultQuestionable.confidence.level).toBe('QUESTIONABLE');
      
      const responsesValid: RawResponse[] = [];
      // 7 same answers in a row = < max_allowed_streak(12) -> VALID
      for (let i = 0; i < 7; i++) {
        responsesValid.push({ question_id: `q${i}`, question_code: `R_${i}`, dimension_id: 'd', framework: 'riasec', matching_role: 'primary', is_reverse_scored: false, weight: 1, response_value: 3 });
      }
      const resultValid = calculateScoringV1(responsesValid, [], config, startedAt, completedAt);
      expect(resultValid.confidence.level).toBe('VALID');
    });
  });
});
