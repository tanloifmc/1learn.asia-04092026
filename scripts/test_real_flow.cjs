require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = `test.real.${Date.now()}@example.com`;
  const { data: user } = await supabase.auth.admin.createUser({ email, password: 'password123', email_confirm: true });
  const userId = user.user.id;
  console.log("Created user", userId);

  await supabase.from('student_profiles').insert({ id: userId, grade: 10, onboarding_step: 2 });
  
  const { data: version } = await supabase.from('assessment_versions').select('id').limit(1).single();
  const { data: session } = await supabase.from('assessment_sessions').insert({
    student_id: userId, version_id: version.id, status: 'in_progress', started_at: new Date().toISOString()
  }).select('id').single();

  const { data: dim } = await supabase.from('assessment_dimensions').select('id, code, framework').limit(1).single();

  console.log("Saving Assessment Result via RPC (simulating UI submit)...");
  const res = await supabase.rpc('save_assessment_result', {
    p_session_id: session.id, p_student_id: userId, p_version_id: version.id, p_scoring_version: '1.0',
    p_completion_quality: { rate: 1, missingRate: 0, timeQuality: 'normal', riasec_profile: {}, top3_riasec_code: 'R', career_readiness_stage: 'exploring', quality_flags: {} },
    p_confidence: 0.9,
    p_dimensions: [ { dimension_id: dim.id, score: 5 } ],
    p_signals: [ { signal_type: `${dim.framework}_${dim.code.toLowerCase()}`, value: 5, confidence: 0.9, valid_until: new Date(Date.now() + 86400000).toISOString() } ]
  });

  // Now, we will simulate the exact Next.js code using local files if possible, but actually we can just hit our E2E trigger!
  // Wait, E2E trigger in API uses our updated roadmap logic now!
  const apiUrl = 'http://localhost:3000/api/e2e-trigger';
  console.log(`Triggering E2E Flow via local API...`);
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId })
  });

  const json = await response.json();
  console.log("E2E Result:", JSON.stringify(json, null, 2));

  if (json.success) {
    console.log("E2E SUCCEEDED!");
  } else {
    console.error("E2E FAILED!");
  }
}

run().catch(console.error);
