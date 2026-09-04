const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestStudentAndScore() {
  const email = `test.e2e.${Date.now()}@example.com`;
  const password = "Password123!";
  
  console.log(`Creating test user: ${email}`);
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (authErr) throw authErr;
  const userId = authData.user.id;
  console.log(`User created: ${userId}`);

  const { error: spErr } = await supabase.from('student_profiles').insert({
    id: userId,
    grade: 12,
    birth_year: 2008,
    region: 'HNI',
    onboarding_step: 4
  });
  
  if (spErr) {
    console.warn("Could not insert student_profiles, maybe trigger already did it?", spErr.message);
  } else {
    console.log(`Created student_profile for ${userId}`);
  }

  // Create an assessment session
  const { data: sessionData, error: sessionErr } = await supabase.from('assessment_sessions').insert({
    student_id: userId,
    version_id: '4b207608-1f66-4fa4-9ff6-12b2f2e2abb2',
    status: 'in_progress',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString()
  }).select('id').single();

  if (sessionErr) throw sessionErr;
  console.log(`Session created: ${sessionData.id}`);

  const signals = [
    { signal_type: 'riasec_r', signal_value: 5, confidence_score: 0.9 },
    { signal_type: 'riasec_i', signal_value: 5, confidence_score: 0.9 },
    { signal_type: 'riasec_a', signal_value: 1, confidence_score: 0.9 },
    { signal_type: 'riasec_s', signal_value: 1, confidence_score: 0.9 },
    { signal_type: 'riasec_e', signal_value: 4, confidence_score: 0.9 },
    { signal_type: 'riasec_c', signal_value: 4, confidence_score: 0.9 },
  ];

  const { data: resultData, error: resultErr } = await supabase.from('assessment_results').insert({
    session_id: sessionData.id,
    student_id: userId,
    version_id: '4b207608-1f66-4fa4-9ff6-12b2f2e2abb2',
    scoring_version: '1.0',
    completion_quality: { total_duration_seconds: 600, inconsistency_score: 0 },
    confidence: { riasec: 0.9, ability: 0.8 },
    is_current: true,
    completed_at: new Date().toISOString()
  }).select('id').single();

  if (resultErr) throw resultErr;

  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  // Insert into derived_profile_signals directly
  const signalsToInsert = signals.map(s => ({
    student_id: userId,
    signal_type: s.signal_type,
    value: s.signal_value,
    source_type: 'assessment',
    source_id: resultData.id, // Using assessment_results.id as source_id
    source_version: '1.0',
    confidence: s.confidence_score,
    valid_until: validUntil.toISOString()
  }));

  const { error: signalErr } = await supabase.from('derived_profile_signals').insert(signalsToInsert);
  if (signalErr) throw signalErr;
  console.log(`Inserted ${signalsToInsert.length} signals for ${userId}`);

  // Directly insert into student_career_profiles
  const { error: profileErr } = await supabase.from('student_career_profiles').insert({
    student_id: userId,
    profile_version: 1,
    evidence_coverage: 0.4,
    profile_features: {
      riasec: { r: 50, i: 50, a: 10, s: 10, e: 40, c: 40 },
      values: {},
      ability: {},
      academic: {}
    },
    source_assessment_versions: { riasec: '1.0' },
    is_current: true,
    computed_at: new Date().toISOString()
  });

  if (profileErr) throw profileErr;
  console.log(`Student profile created for ${userId}`);

  console.log('Triggering E2E Flow via local API...');
  const triggerRes = await fetch('http://localhost:3000/api/e2e-trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  
  const matchResult = await triggerRes.json();
  console.log('E2E Result:', JSON.stringify(matchResult, null, 2));

  if (!matchResult.success) {
    console.error("E2E FAILED!");
  } else {
    console.log("E2E SUCCEEDED!");
  }
}

createTestStudentAndScore().catch(console.error);
