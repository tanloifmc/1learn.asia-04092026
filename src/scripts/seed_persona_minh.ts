import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configuration for Environment Isolation
// TODO: Update these with actual values once the Staging/Prod split is complete
const KNOWN_PROD_PROJECT_REFS = [
  'cbhkri...wuwut', // Replace with ACTUAL prod ref when Staging is split
  process.env.PROD_SUPABASE_PROJECT_REF,
].filter(Boolean);

function verifySeedSafety() {
  const env = process.env.NODE_ENV || 'development';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectRef = process.env.SUPABASE_PROJECT_REF || '';
  const vercelEnv = process.env.VERCEL_ENV || '';

  console.log(`[Safety Check] Environment: ${env}`);
  console.log(`[Safety Check] Vercel Env: ${vercelEnv}`);
  console.log(`[Safety Check] Supabase URL: ${supabaseUrl}`);
  console.log(`[Safety Check] Project Ref: ${projectRef}`);

  // 1. Check runtime environment
  if (env === 'production' || vercelEnv === 'production') {
    throw new Error('NGUY HIỂM: Tuyệt đối không được chạy script seed demo trên môi trường runtime Production!');
  }

  // 2. Check actual target project (Project Identity Verification)
  const isTargetingProd = KNOWN_PROD_PROJECT_REFS.some(
    ref => supabaseUrl.includes(ref as string) || projectRef === ref
  );

  if (isTargetingProd) {
    throw new Error(`NGUY HIỂM: Target Supabase URL/Ref khớp với Production Project. KHÔNG ĐƯỢC PHÉP SEED!`);
  }

  // 3. Must have service role key (Never use anon key for seeding)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY. Seed script phải chạy bằng Service Role.');
  }

  console.log('✅ Safety Guard Passed: Target is NOT Production.');
}

async function seedPersonaMinh() {
  try {
    verifySeedSafety();
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }

  console.log('Bắt đầu seed Persona Minh...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const MINH_EMAIL = 'minh.demo@example.com';
  const MINH_PASSWORD = 'Password123!';

  // 1. Create Auth User
  console.log('1. Đang tạo User Auth...');
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: MINH_EMAIL,
    password: MINH_PASSWORD,
    email_confirm: true,
  });

  if (authError && authError.status !== 422) { // 422 is usually "user already exists"
      console.error('Lỗi tạo user auth:', authError);
      return;
  }
  
  let userId = authData?.user?.id;

  if (!userId) {
     const { data: users } = await adminClient.auth.admin.listUsers();
     const existingUser = users.users.find(u => u.email === MINH_EMAIL);
     if (existingUser) {
        userId = existingUser.id;
        console.log('User đã tồn tại, dùng ID:', userId);
     } else {
        throw new Error('Không thể lấy User ID');
     }
  }

  // 2. Update Profile with is_demo = true (REQUIRED IDENTITY PRINCIPLE)
  console.log('2. Đang tạo/cập nhật Profile (is_demo = true)...');
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: userId,
      email: MINH_EMAIL,
      full_name: 'Trần Văn Minh (Demo)',
      avatar_url: null,
      is_demo: true, // HARD REQUIREMENT
    });

  if (profileError) {
    console.error('Lỗi cập nhật profile:', profileError);
    return;
  }

  console.log('✅ Seed hoàn tất! Minh (is_demo = true) đã sẵn sàng.');
}

seedPersonaMinh().catch(console.error);
