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
  console.log("Seeding Master Journey Data (Real Universities & Edge Case Students)...");

  // ==========================================
  // 1. SEED REAL UNIVERSITIES
  // ==========================================
  const universities = [
    { name: "Đại học Bách Khoa TP.HCM", short_name: "HCMUT", slug: "hcmut", type: "public", scale: "large", location_city: "Hồ Chí Minh", location_region: "South", status: "published" },
    { name: "Đại học Khoa học Tự nhiên TP.HCM", short_name: "HCMUS", slug: "hcmus", type: "public", scale: "large", location_city: "Hồ Chí Minh", location_region: "South", status: "published" },
    { name: "Đại học Kinh tế TP.HCM", short_name: "UEH", slug: "ueh", type: "public", scale: "large", location_city: "Hồ Chí Minh", location_region: "South", status: "published" },
    { name: "Đại học Ngoại thương Cơ sở II", short_name: "FTU2", slug: "ftu2", type: "public", scale: "medium", location_city: "Hồ Chí Minh", location_region: "South", status: "published" },
    { name: "Đại học FPT TP.HCM", short_name: "FPT", slug: "fpt-hcm", type: "private", scale: "large", location_city: "Hồ Chí Minh", location_region: "South", status: "published" },
    { name: "Đại học RMIT Việt Nam", short_name: "RMIT", slug: "rmit-vn", type: "international", scale: "medium", location_city: "Hồ Chí Minh", location_region: "South", status: "published" }
  ];

  console.log("Upserting Universities...");
  const { data: uniData, error: uniErr } = await supabase.from('universities').upsert(universities, { onConflict: 'slug' }).select();
  if (uniErr) throw uniErr;
  const uniMap = new Map(); uniData.forEach(u => uniMap.set(u.slug, u.id));

  // ==========================================
  // 2. SEED MAJORS
  // ==========================================
  const majors = [
    { name: "Khoa học máy tính", slug: "khoa-hoc-may-tinh", field: "Technology", status: "published" },
    { name: "Kỹ thuật phần mềm", slug: "ky-thuat-phan-mem", field: "Technology", status: "published" },
    { name: "Quản trị kinh doanh", slug: "quan-tri-kinh-doanh", field: "Business", status: "published" },
    { name: "Kinh tế quốc tế", slug: "kinh-te-quoc-te", field: "Business", status: "published" },
    { name: "Marketing", slug: "marketing", field: "Business", status: "published" }
  ];

  console.log("Upserting Majors...");
  const { data: majorData, error: majorErr } = await supabase.from('majors').upsert(majors, { onConflict: 'slug' }).select();
  if (majorErr) throw majorErr;
  const majorMap = new Map(); majorData.forEach(m => majorMap.set(m.slug, m.id));

  // ==========================================
  // 3. SEED UNIVERSITY PROGRAMS & ADMISSION DATA (Real Historical Data)
  // ==========================================
  // Clean up old ones for idempotency
  await supabase.from('admission_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('university_majors').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const programsToInsert = [
    { university_id: uniMap.get('hcmut'), major_id: majorMap.get('khoa-hoc-may-tinh'), program_type: "Standard" },
    { university_id: uniMap.get('hcmus'), major_id: majorMap.get('khoa-hoc-may-tinh'), program_type: "Standard" },
    { university_id: uniMap.get('fpt-hcm'), major_id: majorMap.get('ky-thuat-phan-mem'), program_type: "Standard" },
    { university_id: uniMap.get('ftu2'), major_id: majorMap.get('kinh-te-quoc-te'), program_type: "Standard" },
    { university_id: uniMap.get('ueh'), major_id: majorMap.get('quan-tri-kinh-doanh'), program_type: "Standard" },
    { university_id: uniMap.get('rmit-vn'), major_id: majorMap.get('quan-tri-kinh-doanh'), program_type: "International" },
  ];

  const { data: umData, error: umErr } = await supabase.from('university_majors').upsert(programsToInsert, { onConflict: 'university_id, major_id, program_type' }).select();
  if (umErr) throw umErr;

  // Real-ish cutoffs for testing
  const admissions = [
    // HCMUT CS - THPT
    { university_major_id: umData[0].id, academic_year: 2023, admission_method: 'THPT', cutoff_score: 28.05, score_scale: 30, data_status: 'published' },
    { university_major_id: umData[0].id, academic_year: 2024, admission_method: 'THPT', cutoff_score: 28.15, score_scale: 30, data_status: 'published' },
    // HCMUT CS - DGNL
    { university_major_id: umData[0].id, academic_year: 2024, admission_method: 'DGNL-HCM', cutoff_score: 950, score_scale: 1200, data_status: 'published' },
    
    // HCMUS CS - THPT
    { university_major_id: umData[1].id, academic_year: 2023, admission_method: 'THPT', cutoff_score: 28.20, score_scale: 30, data_status: 'published' },
    { university_major_id: umData[1].id, academic_year: 2024, admission_method: 'THPT', cutoff_score: 27.80, score_scale: 30, data_status: 'published' },
    
    // FTU2 Econ - THPT
    { university_major_id: umData[3].id, academic_year: 2024, admission_method: 'THPT', cutoff_score: 28.10, score_scale: 30, data_status: 'published' },
    
    // RMIT Biz - IELTS (Using IELTS as strict barrier)
    { university_major_id: umData[5].id, academic_year: 2024, admission_method: 'IELTS', cutoff_score: 6.5, score_scale: 9.0, data_status: 'published' },
  ];
  await supabase.from('admission_data').insert(admissions);

  // ==========================================
  // 3.5 SEED TARGET REQUIREMENTS
  // ==========================================
  console.log("Seeding Target Requirements...");
  await supabase.from('target_requirements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const requirementsToInsert = [
    // HCMUT CS - Needs Math >= 8.0
    { target_type: 'university_major', target_id: umData[0].id, requirement_code: 'academic_math', requirement_type: 'academic', comparison_operator: '>=', requirement_value: '8.0', unit: 'score_10', importance: 'high', status: 'verified', source: 'DeAnTuyenSinh2024' },
    // HCMUT CS - English >= B1
    { target_type: 'university_major', target_id: umData[0].id, requirement_code: 'english_level', requirement_type: 'skill', comparison_operator: '>=', requirement_value: 'B1', unit: 'CEFR', importance: 'medium', status: 'verified', source: 'DeAnTuyenSinh2024' },
    
    // RMIT Biz - IELTS >= 6.5
    { target_type: 'university_major', target_id: umData[5].id, requirement_code: 'ielts_overall', requirement_type: 'certification', comparison_operator: '>=', requirement_value: '6.5', unit: 'IELTS', importance: 'critical', status: 'verified', source: 'RMIT Admission 2024' },
  ];
  await supabase.from('target_requirements').insert(requirementsToInsert);

  // ==========================================
  // 4. SEED TEST STUDENTS (Edge Cases)
  // ==========================================
  console.log("Seeding Student Edge Cases...");
  
  // Fetch real users to avoid Foreign Key violations
  const { data: usersData, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.warn("Could not fetch auth users for seeding. Skipping student profiles:", authError.message);
  } else if (!usersData.users || usersData.users.length === 0) {
    console.warn("No auth users found in the database. Please sign up a user in the UI first. Skipping student edge cases seed.");
  } else {
    const realA = usersData.users[0]?.id;
    const realB = usersData.users[1]?.id || usersData.users[0]?.id;

    // Ensure they exist in student_profiles
    const spRes = await supabase.from('student_profiles').upsert([
      { id: realA, grade: 12 },
      { id: realB, grade: 10 }
    ]);
    if (spRes.error) console.error("student_profiles seed error:", spRes.error);


    // Seed Academic Records
    const acRes = await supabase.from('academic_records').upsert([
      { student_id: realA, subject: 'Toán', subject_code: 'toan', grade_level: 12, performance_level: 'strong', score: 9.0, academic_year: '2023-2024', source: 'self_report' },
      { student_id: realA, subject: 'Vật lý', subject_code: 'ly', grade_level: 12, performance_level: 'strong', score: 9.2, academic_year: '2023-2024', source: 'self_report' },
      { student_id: realA, subject: 'Hóa học', subject_code: 'hoa', grade_level: 12, performance_level: 'strong', score: 8.8, academic_year: '2023-2024', source: 'self_report' },
      // B is Grade 10
      { student_id: realB, subject: 'Toán', subject_code: 'toan', grade_level: 10, performance_level: 'strong', score: 8.5, academic_year: '2023-2024', source: 'self_report' },
      { student_id: realB, subject: 'Tiếng Anh', subject_code: 'anh', grade_level: 10, performance_level: 'average', score: 7.0, academic_year: '2023-2024', source: 'self_report' },
    ]);
    if (acRes.error) console.error("academic_records seed error:", acRes.error);

    // Seed Profile Versions
    const pvRes = await supabase.from('student_career_profiles').upsert([
      { student_id: realA, profile_version: 1, evidence_coverage: 0.8, profile_features: { primary: 'I', secondary: 'C' } },
      { student_id: realB, profile_version: 1, evidence_coverage: 0.5, profile_features: { primary: 'S', secondary: 'E' } }
    ], { onConflict: 'student_id, profile_version' });
    if (pvRes.error) console.error("student_career_profiles seed error:", pvRes.error);
  }

  console.log("✅ Master Journey Data Seeded Successfully!");
}

main().catch(console.error);
