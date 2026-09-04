import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('--- SEEDING DEV/TEST ASSESSMENT FIXTURE ---');

  // 1. Get published version
  const { data: version, error: versionErr } = await supabase
    .from('assessment_versions')
    .select('id')
    .eq('status', 'published')
    .single();

  if (versionErr || !version) {
    console.error('No published version found.', versionErr);
    return;
  }

  // 2. Get all questions for this version
  const { data: questions, error: questionsErr } = await supabase
    .from('assessment_questions')
    .select('id, question_code')
    .eq('version_id', version.id);

  if (questionsErr || !questions) {
    console.error('No questions found.', questionsErr);
    return;
  }
  
  // 3. Create a test student if none exists
  const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
  const testStudentId = profile?.id;

  if (!testStudentId) {
    console.error('No profiles found in the database. Please create one first.');
    return;
  }

  // 4. Create an assessment session (completed)
  const sessionId = uuidv4();
  const startedAt = new Date(Date.now() - 1500 * 1000); // 25 mins ago
  const completedAt = new Date();

  const { error: sessionErr } = await supabase
    .from('assessment_sessions')
    .insert({
      id: sessionId,
      student_id: testStudentId,
      version_id: version.id,
      status: 'completed',
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString()
    });

  if (sessionErr) {
    console.error('Failed to insert session', sessionErr);
    return;
  }

  // 5. Generate responses for all questions
  const responses = questions.map((q) => {
    // Deterministic random response 1-5 to avoid straightlining
    const val = (q.id.charCodeAt(0) % 5) + 1;
    let finalVal = val;
    // Set some valid expected answers for attention checks
    if (q.question_code === 'VQ_A01') finalVal = 4;
    if (q.question_code === 'VQ_A02') finalVal = 1;
    if (q.question_code === 'VQ_A03') finalVal = 5;

    return {
      id: uuidv4(),
      session_id: sessionId,
      question_id: q.id,
      response_value: finalVal
    };
  });

  const { error: responsesErr } = await supabase
    .from('assessment_responses')
    .insert(responses);

  if (responsesErr) {
    console.error('Failed to insert responses', responsesErr);
    return;
  }

  console.log(`Successfully seeded session ${sessionId} with ${responses.length} responses.`);
  console.log(`User ID: ${testStudentId}`);
}

run().catch(console.error);
