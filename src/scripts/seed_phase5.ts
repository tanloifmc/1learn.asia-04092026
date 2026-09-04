import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Seeding Phase 5 Development Dataset...");

  // 1. Seed Majors (Technology & Business focus)
  const majors = [
    {
      name: "Khoa học máy tính",
      code: "7480101",
      slug: "khoa-hoc-may-tinh",
      field: "Technology",
      description: "Nghiên cứu về cơ sở lý thuyết của thông tin và tính toán.",
      status: "published"
    },
    {
      name: "Kỹ thuật phần mềm",
      code: "7480103",
      slug: "ky-thuat-phan-mem",
      field: "Technology",
      description: "Phát triển và bảo trì phần mềm có hệ thống.",
      status: "published"
    },
    {
      name: "Trí tuệ nhân tạo",
      code: "7480107",
      slug: "tri-tue-nhan-tao",
      field: "Technology",
      description: "Lĩnh vực nghiên cứu chế tạo máy móc thông minh.",
      status: "published"
    },
    {
      name: "Quản trị kinh doanh",
      code: "7340101",
      slug: "quan-tri-kinh-doanh",
      field: "Business",
      description: "Nghiên cứu quá trình quản lý, tổ chức doanh nghiệp.",
      status: "published"
    },
    {
      name: "Marketing",
      code: "7340115",
      slug: "marketing",
      field: "Business",
      description: "Quá trình truyền đạt giá trị sản phẩm đến khách hàng.",
      status: "published"
    }
  ];

  console.log("Upserting Majors...");
  const { data: majorData, error: majorErr } = await supabase
    .from('majors')
    .upsert(majors, { onConflict: 'slug' })
    .select();

  if (majorErr) throw majorErr;

  const majorMap = new Map();
  majorData.forEach(m => majorMap.set(m.slug, m.id));

  // 2. Seed Universities
  const universities = [
    {
      name: "Đại học Bách Khoa TP.HCM",
      short_name: "HCMUT",
      slug: "hcmut",
      location_city: "Hồ Chí Minh",
      location_region: "South",
      type: "public",
      scale: "large",
      status: "published"
    },
    {
      name: "Đại học Khoa học Tự nhiên TP.HCM",
      short_name: "HCMUS",
      slug: "hcmus",
      location_city: "Hồ Chí Minh",
      location_region: "South",
      type: "public",
      scale: "large",
      status: "published"
    },
    {
      name: "Đại học Kinh tế TP.HCM",
      short_name: "UEH",
      slug: "ueh",
      location_city: "Hồ Chí Minh",
      location_region: "South",
      type: "public",
      scale: "large",
      status: "published"
    }
  ];

  console.log("Upserting Universities...");
  const { data: uniData, error: uniErr } = await supabase
    .from('universities')
    .upsert(universities, { onConflict: 'slug' })
    .select();

  if (uniErr) throw uniErr;

  const uniMap = new Map();
  uniData.forEach(u => uniMap.set(u.slug, u.id));

  // 3. Seed University Majors (Programs)
  const uniMajors = [
    {
      university_id: uniMap.get('hcmut'),
      major_id: majorMap.get('khoa-hoc-may-tinh'),
      program_name: "Khoa học máy tính",
      degree_level: "Bachelor",
      program_type: "Standard"
    },
    {
      university_id: uniMap.get('hcmut'),
      major_id: majorMap.get('khoa-hoc-may-tinh'),
      program_name: "Khoa học máy tính (Tiên tiến)",
      degree_level: "Bachelor",
      program_type: "Advanced"
    },
    {
      university_id: uniMap.get('hcmus'),
      major_id: majorMap.get('khoa-hoc-may-tinh'),
      program_name: "Khoa học máy tính",
      degree_level: "Bachelor",
      program_type: "Standard"
    },
    {
      university_id: uniMap.get('hcmus'),
      major_id: majorMap.get('ky-thuat-phan-mem'),
      program_name: "Kỹ thuật phần mềm",
      degree_level: "Bachelor",
      program_type: "Standard"
    },
    {
      university_id: uniMap.get('ueh'),
      major_id: majorMap.get('quan-tri-kinh-doanh'),
      program_name: "Quản trị kinh doanh",
      degree_level: "Bachelor",
      program_type: "Standard"
    },
    {
      university_id: uniMap.get('ueh'),
      major_id: majorMap.get('marketing'),
      program_name: "Marketing",
      degree_level: "Bachelor",
      program_type: "Standard"
    }
  ];

  console.log("Upserting University Majors...");
  // First clear them to prevent duplicate conflicts if run multiple times
  await supabase.from('admission_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('university_majors').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data: umData, error: umErr } = await supabase
    .from('university_majors')
    .insert(uniMajors)
    .select();

  if (umErr) throw umErr;

  // 4. Seed Admission Data (2023-2025)
  // HCMUT - CS
  const hcmut_cs = umData.find(u => u.university_id === uniMap.get('hcmut') && u.program_type === 'Standard');
  const hcmus_cs = umData.find(u => u.university_id === uniMap.get('hcmus') && u.program_type === 'Standard');
  const hcmus_se = umData.find(u => u.university_id === uniMap.get('hcmus') && u.major_id === majorMap.get('ky-thuat-phan-mem'));
  const ueh_biz = umData.find(u => u.university_id === uniMap.get('ueh') && u.major_id === majorMap.get('quan-tri-kinh-doanh'));

  const admissionsData = [
    // HCMUT CS - THPT
    { university_major_id: hcmut_cs.id, academic_year: 2023, admission_method: 'THPT', subject_combination: 'A00, A01', cutoff_score: 28.05, score_scale: 30, data_status: 'published' },
    { university_major_id: hcmut_cs.id, academic_year: 2024, admission_method: 'THPT', subject_combination: 'A00, A01', cutoff_score: 28.15, score_scale: 30, data_status: 'published' },
    { university_major_id: hcmut_cs.id, academic_year: 2025, admission_method: 'THPT', subject_combination: 'A00, A01', cutoff_score: 28.25, score_scale: 30, data_status: 'published' },
    
    // HCMUS CS - THPT
    { university_major_id: hcmus_cs.id, academic_year: 2023, admission_method: 'THPT', subject_combination: 'A00, A01', cutoff_score: 28.20, score_scale: 30, data_status: 'published' },
    { university_major_id: hcmus_cs.id, academic_year: 2024, admission_method: 'THPT', subject_combination: 'A00, A01', cutoff_score: 27.80, score_scale: 30, data_status: 'published' },
    { university_major_id: hcmus_cs.id, academic_year: 2025, admission_method: 'THPT', subject_combination: 'A00, A01', cutoff_score: 28.00, score_scale: 30, data_status: 'published' },

    // HCMUS SE - THPT
    { university_major_id: hcmus_se.id, academic_year: 2023, admission_method: 'THPT', subject_combination: 'A00, A01', cutoff_score: 27.50, score_scale: 30, data_status: 'published' },
    { university_major_id: hcmus_se.id, academic_year: 2024, admission_method: 'THPT', subject_combination: 'A00, A01', cutoff_score: 27.20, score_scale: 30, data_status: 'published' },
    { university_major_id: hcmus_se.id, academic_year: 2025, admission_method: 'THPT', subject_combination: 'A00, A01', cutoff_score: 27.60, score_scale: 30, data_status: 'published' },

    // UEH BIZ - THPT
    { university_major_id: ueh_biz.id, academic_year: 2023, admission_method: 'THPT', subject_combination: 'A00, A01, D01', cutoff_score: 26.50, score_scale: 30, data_status: 'published' },
    { university_major_id: ueh_biz.id, academic_year: 2024, admission_method: 'THPT', subject_combination: 'A00, A01, D01', cutoff_score: 26.75, score_scale: 30, data_status: 'published' },
    
    // HCMUT CS - DGNL
    { university_major_id: hcmut_cs.id, academic_year: 2024, admission_method: 'DGNL-HCM', subject_combination: 'All', cutoff_score: 950, score_scale: 1200, data_status: 'published' },
    { university_major_id: hcmut_cs.id, academic_year: 2025, admission_method: 'DGNL-HCM', subject_combination: 'All', cutoff_score: 965, score_scale: 1200, data_status: 'published' },
  ];

  console.log("Upserting Admission Data...");
  const { error: admErr } = await supabase
    .from('admission_data')
    .insert(admissionsData);

  if (admErr) throw admErr;

  console.log("Successfully seeded Phase 5 Development Dataset.");
}

main().catch(console.error);
