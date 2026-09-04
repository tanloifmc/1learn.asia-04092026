import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { calculateScoringV1, DimensionMeta, RawResponse } from '../../src/features/assessment/utils/scoring';
import { interpretProfile, calculateHollandCode } from '../../src/features/career/actions/interpretation-engine';
import { buildReportData } from '../../src/features/career/actions/report-builder';
import { CapabilityState } from '../../src/types/report';

dotenv.config({ path: '.env.local' });

describe('STEP 5.5 REAL DATA INTEGRATION GATE', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let dimensions: DimensionMeta[] = [];
  let questions: any[] = [];

  beforeAll(async () => {
    // 1. Fetch real version
    const { data: version } = await supabase
      .from('assessment_versions')
      .select('id')
      .eq('status', 'published')
      .single();

    if (!version) throw new Error('No published version found in DB');

    // 2. Fetch real dimensions
    const { data: dims } = await supabase
      .from('assessment_dimensions')
      .select('id, code, name, framework, raw_min, raw_max, normalization_formula, matching_role')
      .eq('version_id', version.id);
    dimensions = dims || [];

    // 3. Fetch real questions
    const { data: qs } = await supabase
      .from('assessment_questions')
      .select('id, question_code, dimension_id, is_reverse_scored, weight')
      .eq('version_id', version.id);
    questions = qs || [];
  });

  it('E2E Pipeline trace produces expected ReportData', () => {
    expect(dimensions.length).toBeGreaterThan(0);
    expect(questions.length).toBeGreaterThan(0);

    // 1. Generate fake responses mimicking a real student (avoid straightlining)
    const responses: RawResponse[] = questions.map((q, idx) => {
      let val = (idx % 5) + 1; // 1, 2, 3, 4, 5, 1, 2, ...
      
      const dim = dimensions.find(d => d.id === q.dimension_id);
      
      // pass attention checks intentionally to be VALID
      if (q.question_code === 'VQ_A01') val = 4;
      if (q.question_code === 'VQ_A02') val = 1;
      if (q.question_code === 'VQ_A03') val = 5;

      return {
        question_id: q.id,
        question_code: q.question_code,
        dimension_id: q.dimension_id,
        framework: dim?.framework || '',
        matching_role: dim?.matching_role || '',
        is_reverse_scored: q.is_reverse_scored,
        weight: q.weight,
        response_value: val,
      };
    });

    // 2. Run SCORING
    const config = {
      options_scale: { min: 1, max: 5 }, "validity_rules": { "expected_answers": { "VQ_A01": 4, "VQ_A02": 1, "VQ_A03": 5 }, "max_attention_failures_allowed": 1, "max_straightline_streak_allowed": 12, "expected_duration_seconds": 600 }
    };
    
    // Fake started 15 minutes ago
    const startedAt = new Date(Date.now() - 15 * 60 * 1000);
    const completedAt = new Date();

    const scoringResult = calculateScoringV1(responses, dimensions, config, startedAt, completedAt);
    
    // check global validity
    expect(scoringResult.confidence.level).toBe('VALID');
    expect(scoringResult.quality.attention_failures).toBe(0);

    // 3. Run PROFILE BUILDER (in-memory mapping)
    const profileFeatures: any = {
      interests: { framework: 'riasec', scores: {}, primary_code: "" },
      personality: { framework: 'big_five', scores: {} },
      work_values: { framework: 'work_values', scores: {} },
      readiness: { score: 0, level: 'STARTING' },
      meta: { validity: scoringResult.confidence.level, source_assessments: ['v1'] }
    };

    for (const [framework, scores] of Object.entries(scoringResult.frameworks)) {
      if (framework === 'riasec') {
        profileFeatures.interests.scores = scores;
        const hc = calculateHollandCode(scores as Record<string, number>);
        profileFeatures.interests.ranked_dimensions = hc.ranked_dimensions;
        profileFeatures.interests.primary_code = hc.primary_code;
      } else if (framework === 'big_five') {
        profileFeatures.personality.scores = scores;
      } else if (framework === 'work_values') {
        profileFeatures.work_values.scores = scores;
      }
    }

    // 4. Run REPORT BUILDER
    // buildReportData expects profileFeatures and will call interpretProfile internally.
    const reportData = buildReportData('test-user-id', 'test-assessment-id', profileFeatures);

    // Output for PO
    console.log("=== REPORT DATA SNAPSHOT ===");
    console.log(JSON.stringify(reportData, null, 2));

    // 6. VALIDATE CONTRACT
    // Global validity
    expect(reportData.validity).toBe('VALID');
    
    // RIASEC có đủ 6 dimensions
    expect(reportData.riasec.state).toBe('AVAILABLE');
    expect(reportData.riasec.dimensions.length).toBe(6);
    expect(reportData.riasec.hollandCode).toBeTruthy(); // Lấy từ source

    // Big Five có classification
    expect(reportData.bigFive.state).toBe('AVAILABLE'); 
    for (const trait of reportData.bigFive.traits) {
       expect(['PROMINENT', 'MODERATE', 'LOWER']).toContain(trait.classification);
    }

    // Work Values giữ đúng ranking
    expect(reportData.workValues.state).toBe('AVAILABLE');
    expect(reportData.workValues.values.length).toBeGreaterThan(0);
    // Check sorted
    for (let i = 0; i < reportData.workValues.values.length - 1; i++) {
      expect(reportData.workValues.values[i].rank).toBeLessThanOrEqual(reportData.workValues.values[i+1].rank);
    }

    // Strengths / Watch-outs
    expect(reportData.strengths.state).toBe('AVAILABLE');
    expect(reportData.watchOuts.state).toBe('EMPTY'); // Some environments and watchouts might be empty
    expect(reportData.environments.state).toBe('AVAILABLE');

    // CrossDimension: no patterns mock means EMPTY
    expect(reportData.crossDimension.state).toBe('EMPTY');
    expect(reportData.crossDimension.patterns).toEqual([]);

    // Future engines
    expect(reportData.careerExploration.state).toBe('NOT_AVAILABLE');
    expect(reportData.careerExploration.data).toEqual([]);
    expect(reportData.majorExploration.state).toBe('NOT_AVAILABLE');
    expect(reportData.universityExploration.state).toBe('NOT_AVAILABLE');
    expect(reportData.actionPlan.state).toBe('NOT_AVAILABLE');
  });
});
