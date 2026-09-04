import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("=== STARTING REAL ENGINE TEST (Bypassing UI) ===");
  
  // 1. Get a student
  const { data: users } = await supabase.auth.admin.listUsers();
  let studentId = users.users.find(u => u.email === 'teststudent@1learn.asia')?.id;
  
  if (!studentId) {
    const { data: newUser } = await supabase.auth.admin.createUser({
      email: 'teststudent@1learn.asia',
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: 'student', full_name: 'Test Student' }
    });
    studentId = newUser.user!.id;
    await supabase.from('students').insert({ id: studentId, full_name: 'Test Student', phone: '0901234567', status: 'active' });
  }

  // 2. Fetch version & metadata
  const { data: version } = await supabase.from('assessment_versions').select('id, scoring_rules_version').eq('status', 'published').single();
  const { data: dims } = await supabase.from('assessment_dimensions').select('*').eq('version_id', version!.id);
  const { data: questions } = await supabase.from('assessment_questions').select('*').eq('version_id', version!.id);

  console.log(`- Found ${dims!.length} dimensions, ${questions!.length} questions.`);

  // 3. Create Session
  const { data: session } = await supabase.from('assessment_sessions').insert({
    student_id: studentId, version_id: version!.id, status: 'in_progress'
  }).select().single();
  
  console.log(`- Created Session: ${session!.id}`);

  // 4. Generate Responses
  // (We'll just make random responses for all 121 questions)
  const responses = questions!.map(q => ({
    session_id: session!.id,
    question_id: q.id,
    response_value: Math.floor(Math.random() * 5) + 1,
    created_at: new Date().toISOString()
  }));

  await supabase.from('assessment_responses').insert(responses);
  console.log(`- Inserted ${responses.length} responses into DB`);

  // 5. Build raw Responses for calculateScoringV1
  // We need to import the calculateScoringV1 function. Since we're using tsx, we can do it!
  const { calculateScoringV1 } = require('../src/features/assessment/utils/scoring.ts');
  
  const rawResponses = responses.map(r => {
    const q = questions!.find(x => x.id === r.question_id)!;
    const d = dims!.find(x => x.id === q.dimension_id)!;
    return {
      question_id: q.id,
      question_code: q.question_code,
      dimension_id: d.id,
      framework: d.framework,
      matching_role: d.matching_role,
      is_reverse_scored: q.is_reverse_scored,
      weight: q.weight,
      response_value: r.response_value
    };
  });

  console.log("- Running calculateScoringV1 (Math Engine)...");
  const scoringResult = calculateScoringV1(rawResponses, dims, new Date(session!.started_at), new Date());

  // 6. Execute save_assessment_result RPC (this runs the DB-side commit)
  const validUntil = new Date(); validUntil.setFullYear(validUntil.getFullYear() + 1);
  const p_signals = scoringResult.dimensions.map((d: any) => ({
    signal_type: `${d.framework}_${d.code.toLowerCase()}`.replace(/-/g, '_'),
    value: d.normalized_score,
    confidence: scoringResult.quality.score / 100,
    valid_until: validUntil.toISOString(),
  }));
  p_signals.push({ signal_type: 'riasec_profile_code', value: 0, confidence: scoringResult.quality.score / 100, valid_until: validUntil.toISOString() });

  const { data: resultId, error: rpcErr } = await supabase.rpc('save_assessment_result', {
    p_session_id: session!.id,
    p_student_id: studentId,
    p_version_id: version!.id,
    p_scoring_version: version!.scoring_rules_version || '1.0',
    p_completion_quality: {
      rate: 1,
      missingRate: 0,
      timeQuality: "normal",
      riasec_profile: scoringResult.riasec,
      top3_riasec_code: scoringResult.riasec.primary_code,
      career_readiness_stage: scoringResult.career_readiness.stage,
      quality_flags: scoringResult.quality
    },
    p_confidence: scoringResult.confidence,
    p_dimensions: scoringResult.dimensions.map((d: any) => ({ dimension_id: d.dimension_id, score: d.normalized_score })),
    p_signals: p_signals,
  });

  if (rpcErr) throw rpcErr;
  console.log(`- RPC save_assessment_result executed successfully. Result ID: ${resultId}`);

  // 7. Verify tables
  const { data: checkRes } = await supabase.from('assessment_results').select('id, completion_quality').eq('id', resultId).single();
  const { data: checkDims } = await supabase.from('assessment_result_dimensions').select('id').eq('result_id', resultId);
  const { data: checkSignals } = await supabase.from('derived_profile_signals').select('id').eq('student_id', studentId);
  
  console.log("=== DB VERIFICATION ===");
  console.log(`assessment_results: FOUND (${(checkRes as any)!.completion_quality.top3_riasec_code})`);
  console.log(`assessment_result_dimensions: FOUND ${checkDims!.length} rows`);
  console.log(`derived_profile_signals: FOUND ${checkSignals!.length} rows`);
  console.log("=== SUCCESS ===");
}

runTest().catch(console.error);
