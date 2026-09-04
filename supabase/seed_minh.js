import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cbhkrijxgqedcxywuwut.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedTestUserMinh() {
  console.log('Seeding test user Minh...');

  // 1. Create or get user Minh (Test User)
  const email = 'minh.test@1learn.asia';
  
  let { data: users, error: listError } = await supabase.auth.admin.listUsers();
  let user = (users?.users ?? []).find(u => u.email === email);

  if (!user) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { is_test_user: true } // Mark as E2E test fixture
    });
    if (authError) throw authError;
    user = authData.user;
    console.log('Created user Minh:', user.id);
  } else {
    console.log('User Minh already exists:', user.id);
  }

  // 2. Assign Student Role
  await supabase.from('user_roles').upsert({ user_id: user.id, role: 'student' });

  // 3. Create Student Profile
  await supabase.from('student_profiles').upsert({
    id: user.id,
    grade: 10,
    region: 'Hà Nội',
    onboarding_completed_at: new Date().toISOString(),
  });

  // 4. Create Academic Records
  const subjects = [
    { code: 'MATH', score: 8.5, max: 10 },
    { code: 'PHYSICS', score: 8.0, max: 10 },
    { code: 'ENGLISH', score: 9.0, max: 10 }
  ];
  for (const s of subjects) {
    await supabase.from('academic_records').upsert({
      student_id: user.id,
      subject_code: s.code,
      score: s.score,
      max_score: s.max,
      academic_year: '2025-2026',
      grade_level: 10
    }, { onConflict: 'student_id, subject_code' });
  }

  // 5. Goal will be created via UI flow, no need to seed

  console.log('Seed Minh done. Login with minh.test@1learn.asia / password123');
}

seedTestUserMinh().catch(console.error);
