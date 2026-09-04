import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== Seeding Launch-Critical Data Tier A ===");
  const now = new Date().toISOString();

  // 1. Careers
  const { data: careers, error: errC } = await supabase.from('careers').upsert([
    {
      id: '517173e6-fa11-479f-8de1-8bf708910001',
      code: 'SWE',
      slug: 'software-engineer',
      career_domain_code: 'IT',
      name: 'Software Engineer',
      description: 'Phát triển và bảo trì hệ thống phần mềm.',
      status: 'published',
      source_url: 'https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm',
      last_verified_at: now,
      is_production_eligible: true
    }
  ], { onConflict: 'id' }).select();
  if (errC) throw errC;

  // 2. Majors
  const { data: majors, error: errM } = await supabase.from('majors').upsert([
    {
      id: '617173e6-fa11-479f-8de1-8bf708910002',
      name: 'Khoa học máy tính',
      code: '7480101',
      slug: 'khoa-hoc-may-tinh',
      description: 'Ngành khoa học máy tính.',
      status: 'published',
      source_url: 'https://tuyensinh.hcmut.edu.vn/',
      last_verified_at: now,
      is_production_eligible: true
    }
  ], { onConflict: 'id' }).select();
  if (errM) throw errM;

  // 3. Universities
  const { data: unis, error: errU } = await supabase.from('universities').upsert([
    {
      id: '717173e6-fa11-479f-8de1-8bf708910003',
      name: 'Đại học Bách khoa ĐHQG-HCM',
      code: 'QSB',
      slug: 'dai-hoc-bach-khoa-dhqg-hcm',
      type: 'Public',
      status: 'published',
      source_url: 'https://hcmut.edu.vn/',
      website: 'https://hcmut.edu.vn/',
      last_verified_at: now,
      is_production_eligible: true
    }
  ], { onConflict: 'id' }).select();
  if (errU) throw errU;

  // 4. University Majors
  const { data: umData, error: errUM } = await supabase.from('university_majors').upsert([
    {
      id: '817173e6-fa11-479f-8de1-8bf708910004',
      university_id: unis[0].id,
      major_id: majors[0].id,
      program_name: 'Khoa học máy tính chất lượng cao',
      degree_level: 'Bachelor',
      program_type: 'High Quality',
    }
  ], { onConflict: 'id' }).select();
  if (errUM) throw errUM;

  // 5. Admission Data
  const { error: errA } = await supabase.from('admission_data').upsert([
    {
      id: '917173e6-fa11-479f-8de1-8bf708910005',
      university_major_id: umData[0].id,
      academic_year: 2024,
      admission_method: 'THPT',
      subject_combination: 'A00, A01',
      cutoff_score: 28.05,
      score_scale: 30,
      data_status: 'published',
      source_url: 'https://tuyensinh.hcmut.edu.vn/tintuc/diem-chuan-2024',
      last_verified_at: now,
      is_production_eligible: true
    }
  ], { onConflict: 'id' });
  if (errA) throw errA;

  console.log("Successfully seeded Launch-Critical Data Tier.");
}
main().catch(console.error);
