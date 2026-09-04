import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding Mock RIASEC Assessment...');

  // 1. Create Assessment
  const { data: assessment, error: aErr } = await supabase.from('assessments').insert({
    code: 'RIASEC_MOCK',
    name: 'Mock Holland Code (RIASEC)',
    description: 'Technical validation mock for RIASEC assessment.'
  }).select().single();

  if (aErr) {
    if (aErr.code === '23505') {
      console.log('Mock assessment already exists. Aborting seed.');
      return;
    }
    throw aErr;
  }

  // 2. Create Version
  const { data: version, error: vErr } = await supabase.from('assessment_versions').insert({
    assessment_id: assessment.id,
    version_tag: '1.0',
    status: 'internal_test',
    scoring_rules_version: 'RIASEC-SCORING-v1.0'
  }).select().single();
  if (vErr) throw vErr;

  // 3. Create Dimensions
  const dims = [
    { code: 'R', name: 'Realistic' },
    { code: 'I', name: 'Investigative' },
    { code: 'A', name: 'Artistic' },
    { code: 'S', name: 'Social' },
    { code: 'E', name: 'Enterprising' },
    { code: 'C', name: 'Conventional' },
  ];

  const dimMap: Record<string, string> = {};
  for (const d of dims) {
    const { data: dimData, error: dErr } = await supabase.from('assessment_dimensions').insert({
      version_id: version.id,
      code: d.code,
      name: d.name
    }).select().single();
    if (dErr) throw dErr;
    dimMap[d.code] = dimData.id;
  }

  // 4. Create Questions (just 2 per dimension for the mock)
  const questions = [
    { text: 'Sửa chữa các thiết bị điện tử hoặc máy móc.', dim: 'R' },
    { text: 'Làm việc ngoài trời thay vì trong văn phòng.', dim: 'R' },
    { text: 'Làm thí nghiệm khoa học.', dim: 'I' },
    { text: 'Giải quyết các bài toán phức tạp.', dim: 'I' },
    { text: 'Viết nhạc, vẽ tranh hoặc sáng tác thơ văn.', dim: 'A' },
    { text: 'Thiết kế trang phục hoặc nội thất.', dim: 'A' },
    { text: 'Giúp đỡ người khác vượt qua khó khăn tâm lý.', dim: 'S' },
    { text: 'Dạy học hoặc hướng dẫn người khác.', dim: 'S' },
    { text: 'Quản lý một nhóm hoặc một dự án kinh doanh.', dim: 'E' },
    { text: 'Thuyết phục người khác mua một sản phẩm.', dim: 'E' },
    { text: 'Sắp xếp hồ sơ, giấy tờ gọn gàng, có hệ thống.', dim: 'C' },
    { text: 'Nhập dữ liệu vào máy tính một cách chính xác.', dim: 'C' }
  ];

  let order = 1;
  for (const q of questions) {
    const { error: qErr } = await supabase.from('assessment_questions').insert({
      version_id: version.id,
      dimension_id: dimMap[q.dim],
      order_index: order++,
      question_text: q.text,
      is_reverse_scored: false,
      weight: 1.0
    });
    if (qErr) throw qErr;
  }

  console.log('Successfully seeded Mock RIASEC Assessment with 12 questions.');
}

seed().catch(console.error);
