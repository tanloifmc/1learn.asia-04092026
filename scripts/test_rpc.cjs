require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: user } = await supabase.auth.admin.createUser({
    email: `test.rpc.${Date.now()}@example.com`,
    password: 'password123',
    email_confirm: true
  });
  
  const userId = user.user.id;
  console.log("Created user", userId);

  // create profile
  await supabase.from('student_profiles').insert({
    id: userId,
    grade: 10,
    birth_year: 2005,
    region: 'North',
    onboarding_step: 1
  });
  
  // get a version id
  const { data: version } = await supabase.from('assessment_versions').select('id').limit(1).single();
  
  // create session
  const { data: session } = await supabase.from('assessment_sessions').insert({
    student_id: userId,
    version_id: version.id,
    status: 'in_progress',
    started_at: new Date().toISOString()
  }).select('id').single();

  const { data: dim } = await supabase.from('assessment_dimensions').select('id, code, framework').limit(1).single();

  console.log("Calling RPC...");
  const res = await supabase.rpc('save_assessment_result', {
    p_session_id: session.id,
    p_student_id: userId,
    p_version_id: version.id,
    p_scoring_version: '1.0',
    p_completion_quality: { rate: 1, missingRate: 0, timeQuality: 'normal', riasec_profile: {}, top3_riasec_code: 'R', career_readiness_stage: 'exploring', quality_flags: {} },
    p_confidence: 0.9,
    p_dimensions: [
      { dimension_id: dim.id, score: 5 }
    ],
    p_signals: [
      { signal_type: `${dim.framework}_${dim.code.toLowerCase()}`, value: 5, confidence: 0.9, valid_until: new Date(Date.now() + 86400000).toISOString() }
    ]
  });

  console.log("RPC Result:", res);
}

run().catch(console.error);
