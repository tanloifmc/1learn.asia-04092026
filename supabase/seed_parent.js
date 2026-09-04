import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cbhkrijxgqedcxywuwut.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedTestUserParent() {
  console.log('Seeding test user Parent...');

  // 1. Create or get user Parent (Test User)
  const email = 'parent.test@1learn.asia';
  
  let { data: users, error: listError } = await supabase.auth.admin.listUsers();
  let user = (users?.users ?? []).find(u => u.email === email);

  if (!user) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { is_test_user: true }
    });
    if (authError) throw authError;
    user = authData.user;
    console.log('Created user Parent:', user.id);
  } else {
    console.log('User Parent already exists:', user.id);
  }

  // 2. Assign Parent Role
  await supabase.from('user_roles').upsert({ user_id: user.id, role: 'parent' });

  // 3. Link to Minh
  const minhEmail = 'minh.test@1learn.asia';
  let minhUser = (users?.users ?? []).find(u => u.email === minhEmail);
  
  if (minhUser) {
    console.log('Linking Parent to Minh...', minhUser.id);
    const { error: linkErr } = await supabase.from('parent_child_links').upsert({
      parent_id: user.id,
      student_id: minhUser.id,
      relationship_type: 'parent',
      status: 'accepted'
    });
    if (linkErr) console.error('Link Error:', linkErr);
  } else {
    console.log('Cannot find Minh user to link.');
  }

  console.log('Seed Parent done. Login with parent.test@1learn.asia / password123');
}

seedTestUserParent().catch(console.error);
