import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for seeding
);

// We assume there's an admin user in auth.users to act as the creator.
async function getAdminId() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error || !users || users.users.length === 0) {
    console.error("No users found to act as Admin:", error);
    return null;
  }
  // Find a user with admin or super_admin role in profiles or user_roles
  // For simplicity of seeding, we'll just grab the first user or create a fake uuid if none exists.
  return users.users[0].id;
}

const realCareers = [
  {
    code: 'SOFTWARE_ENGINEER',
    name: 'Kỹ sư phần mềm',
    name_en: 'Software Engineer',
    slug: 'ky-su-phan-mem',
    career_domain_code: 'TECHNOLOGY',
    description: 'Chuyên gia thiết kế, phát triển và bảo trì các hệ thống phần mềm.',
    daily_tasks: ['Viết code', 'Tham gia họp Scrum', 'Review code', 'Thiết kế hệ thống'],
    work_environment: 'office',
    skills: [
      { code: 'programming', name: 'Lập trình', importance: 0.9, type: 'hard' },
      { code: 'problem_solving', name: 'Giải quyết vấn đề', importance: 0.9, type: 'soft' },
      { code: 'system_design', name: 'Thiết kế hệ thống', importance: 0.8, type: 'hard' }
    ],
    tools_used: ['VS Code', 'Git', 'Docker', 'AWS'],
    education_paths: [
      { major_code: 'IT', priority: 1, notes: 'Cử nhân CNTT' }
    ],
    market_data: {
      salary: { currency: 'VND', min: 15000000, max: 45000000, period: 'month', location: 'Vietnam', experience_level: 'all', year: 2026, source: 'TopCV Report 2026' },
      demand: { level: 'high', year: 2026, source: 'IT Market Report' }
    },
    good_fit_indicators: ['Thích giải đố', 'Tư duy logic tốt', 'Chịu khó học công nghệ mới'],
    possible_challenges: ['Ngồi nhiều', 'Công nghệ thay đổi liên tục'],
    riasec_profile: { R: 0.2, I: 0.9, A: 0.3, S: 0.2, E: 0.5, C: 0.7 },
    status: 'published',
    source: 'Internal Research',
    source_type: 'internal'
  },
  {
    code: 'DATA_SCIENTIST',
    name: 'Nhà khoa học dữ liệu',
    name_en: 'Data Scientist',
    slug: 'nha-khoa-hoc-du-lieu',
    career_domain_code: 'TECHNOLOGY',
    description: 'Phân tích và diễn giải dữ liệu phức tạp để đưa ra quyết định kinh doanh.',
    daily_tasks: ['Xử lý dữ liệu', 'Xây dựng mô hình ML', 'Trực quan hóa dữ liệu'],
    work_environment: 'office',
    skills: [
      { code: 'python', name: 'Python', importance: 0.9, type: 'hard' },
      { code: 'statistics', name: 'Thống kê', importance: 0.9, type: 'hard' },
      { code: 'analytical', name: 'Phân tích', importance: 0.8, type: 'soft' }
    ],
    tools_used: ['Jupyter', 'SQL', 'Tableau'],
    market_data: {
      salary: { currency: 'VND', min: 20000000, max: 60000000, period: 'month', location: 'Vietnam', experience_level: 'all', year: 2026, source: 'IT Market Report 2026' }
    },
    riasec_profile: { R: 0.2, I: 0.95, A: 0.2, S: 0.1, E: 0.6, C: 0.8 },
    status: 'published',
    source: 'Internal Research',
    source_type: 'internal'
  },
  {
    code: 'GENERAL_PRACTITIONER',
    name: 'Bác sĩ đa khoa',
    name_en: 'General Practitioner',
    slug: 'bac-si-da-khoa',
    career_domain_code: 'HEALTHCARE',
    description: 'Khám, chẩn đoán và điều trị bệnh cho bệnh nhân.',
    daily_tasks: ['Khám bệnh', 'Kê đơn', 'Tư vấn sức khỏe'],
    work_environment: 'mixed',
    skills: [
      { code: 'medical_knowledge', name: 'Kiến thức y khoa', importance: 1.0, type: 'hard' },
      { code: 'empathy', name: 'Thấu cảm', importance: 0.9, type: 'soft' }
    ],
    riasec_profile: { R: 0.5, I: 0.8, A: 0.1, S: 0.9, E: 0.4, C: 0.5 },
    status: 'published'
  }
];

// Generate synthetic data
function generateSyntheticCareers(count: number, adminId: string) {
  const domains = ['TECHNOLOGY', 'HEALTHCARE', 'FINANCE', 'EDUCATION', 'CREATIVE', 'BUSINESS'];
  const baseSkills = ['programming', 'communication', 'leadership', 'analysis', 'design', 'writing', 'management'];
  
  const records = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    const i_val = Math.random();
    const a = Math.random();
    const s = Math.random();
    const e = Math.random();
    const c = Math.random();
    
    records.push({
      code: `SYNTHETIC_CAREER_${i}`,
      name: `Nghề nghiệp giả lập ${i}`,
      slug: `synthetic-career-${i}`,
      career_domain_code: domains[Math.floor(Math.random() * domains.length)],
      description: `Đây là nghề nghiệp giả lập số ${i} để test hiệu năng query JSONB.`,
      skills: [
        { 
          code: baseSkills[Math.floor(Math.random() * baseSkills.length)], 
          name: 'Skill A', 
          importance: 0.8, 
          type: 'hard' 
        },
        { 
          code: baseSkills[Math.floor(Math.random() * baseSkills.length)], 
          name: 'Skill B', 
          importance: 0.5, 
          type: 'soft' 
        }
      ],
      riasec_profile: { R: r, I: i_val, A: a, S: s, E: e, C: c },
      status: 'published',
      created_by: adminId,
      published_at: new Date().toISOString()
    });
  }
  return records;
}

async function main() {
  console.log('Seeding Careers...');
  const adminId = await getAdminId();
  if (!adminId) {
    console.warn("No admin id found, created_by will be null.");
  }

  const payload = realCareers.map(c => ({
    ...c,
    created_by: adminId,
    published_by: adminId,
    published_at: new Date().toISOString()
  }));

  const { error } = await supabase.from('careers').upsert(payload, { onConflict: 'code' });
  if (error) {
    console.error("Error seeding real careers:", error);
  } else {
    console.log("Successfully seeded real careers.");
  }

  console.log("Generating 500 synthetic records...");
  const synthetic = generateSyntheticCareers(500, adminId!);
  
  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < synthetic.length; i += batchSize) {
    const batch = synthetic.slice(i, i + batchSize);
    const { error: synErr } = await supabase.from('careers').upsert(batch, { onConflict: 'code' });
    if (synErr) {
      console.error(`Error inserting batch ${i}:`, synErr);
    }
  }
  console.log("Successfully seeded synthetic careers.");
}

main().catch(console.error);
