import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { calculateScoringV1, DimensionMeta, RawResponse } from '../../src/features/assessment/utils/scoring';
import { buildReportData } from '../../src/features/career/actions/report-builder';

dotenv.config({ path: '.env.local' });

describe('GOLDEN TEST: 121-QUESTION SCORING PIPELINE', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let dimensions: DimensionMeta[] = [];
  let questions: any[] = [];
  let versionConfig: any = {};

  beforeAll(async () => {
    // 1. Fetch real published version
    const { data: version } = await supabase
      .from('assessment_versions')
      .select('id, config')
      .eq('status', 'published')
      .single();

    if (!version) throw new Error('No published version found in DB');
    versionConfig = version.config || {};

    // 2. Fetch real dimensions
    const { data: dims } = await supabase
      .from('assessment_dimensions')
      .select('id, code, name, framework, raw_min, raw_max, normalization_formula, matching_role')
      .eq('version_id', version.id);
    dimensions = dims || [];

    // 3. Fetch real questions (exactly 121 expected)
    const { data: qs } = await supabase
      .from('assessment_questions')
      .select('id, question_code, dimension_id, is_reverse_scored, weight')
      .eq('version_id', version.id);
    questions = qs || [];
  });

  const runPipeline = (responses: RawResponse[], durationSeconds: number = 600, customConfig?: any) => {
    const config = customConfig || {
      options_scale: versionConfig.options_scale || { min: 1, max: 5 },
      validity_rules: versionConfig.validity_rules || { expected_answers: {} }
    };
    const startedAt = new Date(Date.now() - durationSeconds * 1000);
    const completedAt = new Date();
    
    // 1. SCORING
    const scoringResult = calculateScoringV1(responses, dimensions, config, startedAt, completedAt);
    
    // 2. BUILD PROFILE (Simulating buildStudentProfile mapping)
    const profileFeatures: any = {
      interests: { framework: 'riasec', scores: {}, primary_code: "" },
      personality: { framework: 'big_five', scores: {} },
      work_values: { framework: 'work_values', scores: {} },
      meta: { validity: scoringResult.confidence.level, source_assessments: ['v1'] }
    };

    for (const [framework, scores] of Object.entries(scoringResult.frameworks)) {
      if (framework === 'riasec') {
        profileFeatures.interests.scores = scores;
        // Mocking exactly what buildStudentProfile does for Holland Code
        const riasecScores = Object.entries(scores) as [string, number][];
        riasecScores.sort((a, b) => {
          if (b[1] !== a[1]) return b[1] - a[1];
          const order = ['I', 'R', 'A', 'S', 'E', 'C'];
          return order.indexOf(a[0].toUpperCase()) - order.indexOf(b[0].toUpperCase());
        });
        profileFeatures.interests.ranked_dimensions = riasecScores.map(x => x[0]);
        profileFeatures.interests.primary_code = riasecScores.slice(0, 3).map(x => x[0]).join('');
      } else if (framework === 'big_five') {
        profileFeatures.personality.scores = scores;
      } else if (framework === 'work_values') {
        profileFeatures.work_values.scores = scores;
      }
    }

    // 3. REPORT BUILDER (Includes Interpretation Engine)
    let reportData = null;
    let reportError = null;
    try {
      reportData = buildReportData('test-user-id', 'test-assessment-id', profileFeatures);
    } catch (e: any) {
      reportError = e;
    }

    return { scoringResult, profileFeatures, reportData, reportError };
  };

  const createResponses = (valFn: (q: any, idx: number) => number): RawResponse[] => {
    return questions.map((q, idx) => {
      const dim = dimensions.find(d => d.id === q.dimension_id);
      return {
        question_id: q.id,
        question_code: q.question_code,
        dimension_id: q.dimension_id,
        framework: dim?.framework || '',
        matching_role: dim?.matching_role || '',
        is_reverse_scored: q.is_reverse_scored,
        weight: q.weight,
        response_value: valFn(q, idx),
      };
    });
  };

  it('1. MUST LOAD EXACTLY 121 QUESTIONS', () => {
    expect(questions.length).toBe(121);
  });

  it('2. NORMAL VALID PROFILE: Pipeline passes without blocking', () => {
    const expectedAnswers = versionConfig.validity_rules?.expected_answers || {};
    const responses = createResponses((q, idx) => {
      // Pass attention checks
      if (expectedAnswers[q.question_code] !== undefined) {
        return expectedAnswers[q.question_code];
      }
      return (idx % 5) + 1; // 1, 2, 3, 4, 5 (prevents straight-line)
    });

    const result = runPipeline(responses, 600);
    expect(result.scoringResult.confidence.level).toBe('VALID');
    expect(result.reportError).toBeNull();
    expect(result.reportData).not.toBeNull();
    expect(result.reportData?.validity).toBe('VALID');
    expect(result.reportData?.riasec.state).toBe('AVAILABLE');
  });

  it('3. STRAIGHT-LINER: Must be blocked (INVALID)', () => {
    const responses = createResponses(() => 3); // All 3s (Straight-lining)
    const result = runPipeline(responses, 600);
    
    expect(result.scoringResult.confidence.level).toBe('INVALID');
    expect(result.reportError).not.toBeNull();
    expect(result.reportError.message).toContain('INVALID');
  });

  it('4. ATTENTION FAILURE: Must be blocked or questionable', () => {
    const expectedAnswers = versionConfig.validity_rules?.expected_answers || {};
    const responses = createResponses((q, idx) => {
      if (expectedAnswers[q.question_code] !== undefined) {
        return expectedAnswers[q.question_code] === 5 ? 1 : 5; // Deliberately fail
      }
      return (idx % 5) + 1;
    });

    const result = runPipeline(responses, 600);
    const failedChecks = Object.keys(expectedAnswers).length;
    if (failedChecks >= 2) {
      expect(result.scoringResult.confidence.level).toBe('INVALID');
      expect(result.reportError).not.toBeNull();
    } else if (failedChecks === 1) {
      expect(result.scoringResult.confidence.level).toBe('QUESTIONABLE');
      expect(result.reportError).toBeNull();
      expect(result.reportData?.validity).toBe('QUESTIONABLE');
    }
  });

  it('5. TIED RIASEC: Tie-breaking order must strictly be I -> R -> A -> S -> E -> C', () => {
    const expectedAnswers = versionConfig.validity_rules?.expected_answers || {};
    const responses = createResponses((q, idx) => {
      if (expectedAnswers[q.question_code] !== undefined) return expectedAnswers[q.question_code];
      // Force all RIASEC dimensions to get the same exact score by answering 5 for all.
      // Assuming weights and formulas are uniform across RIASEC.
      return 5; 
    });

    const config = {
      options_scale: versionConfig.options_scale || { min: 1, max: 5 },
      validity_rules: { ...(versionConfig.validity_rules || {}), max_straightline_streak_allowed: 150 }
    };
    const result = runPipeline(responses, 600, config);
    expect(result.scoringResult.confidence.level).not.toBe('INVALID');
    
    const hollandCode = result.profileFeatures.interests.primary_code;
    // According to standard Spec 07 Tie-break: I -> R -> A
    expect(hollandCode).toBe('IRA');
  });

  it('6. TIED WORK VALUES: Tie-breaking order must be Achievement -> Independence...', () => {
    const expectedAnswers = versionConfig.validity_rules?.expected_answers || {};
    const responses = createResponses((q, idx) => {
      if (expectedAnswers[q.question_code] !== undefined) return expectedAnswers[q.question_code];
      return 5; 
    });

    const config = {
      options_scale: versionConfig.options_scale || { min: 1, max: 5 },
      validity_rules: { ...(versionConfig.validity_rules || {}), max_straightline_streak_allowed: 150 }
    };
    const result = runPipeline(responses, 600, config);
    const wv = result.reportData?.workValues.values || [];
    
    // Check if the top 3 are exactly the tie-break priority
    expect(wv.length).toBeGreaterThan(0);
    if (wv.length >= 3) {
      expect(wv[0].name).toBe('WV_ACHIEVEMENT');
      expect(wv[1].name).toBe('WV_INDEPENDENCE');
      expect(wv[2].name).toBe('WV_RECOGNITION');
    }
  });

  it('7. EXTREME PERSONALITY: Must flag as PROMINENT', () => {
    const expectedAnswers = versionConfig.validity_rules?.expected_answers || {};
    const responses = createResponses((q, idx) => {
      if (expectedAnswers[q.question_code] !== undefined) return expectedAnswers[q.question_code];
      
      const dim = dimensions.find(d => d.id === q.dimension_id);
      if (dim?.code === 'BF_O') return 5; // Extreme high for Openness
      if (dim?.framework === 'big_five') return 3; // Neutral for others
      return (idx % 5) + 1;
    });

    const config = {
      options_scale: versionConfig.options_scale || { min: 1, max: 5 },
      validity_rules: { ...(versionConfig.validity_rules || {}), max_straightline_streak_allowed: 150 }
    };
    const result = runPipeline(responses, 600, config);
    const bf = result.reportData?.bigFive.traits || [];
    
    const openness = bf.find((t: any) => t.trait === 'O');
    expect(openness).toBeDefined();
    expect(openness?.classification).toBe('PROMINENT');
  });
});
