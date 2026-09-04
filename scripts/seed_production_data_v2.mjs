/**
 * Production Seed Script v2 (fixed schema)
 * Run: node scripts/seed_production_data_v2.mjs
 */

const BASE = 'https://cbhkrijxgqedcxywuwut.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const MGMT = process.env.SUPABASE_MGMT_TOKEN || '';
const PROJ = 'cbhkrijxgqedcxywuwut';

const H = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

async function get(table, params = '') {
  const r = await fetch(`${BASE}/rest/v1/${table}?${params}`, { headers: { ...H, 'Prefer': 'return=representation' } });
  const d = await r.json();
  if (!Array.isArray(d)) throw new Error(`GET ${table}: ${JSON.stringify(d)}`);
  return d;
}

async function insert(table, rows, conflict = null) {
  const url = `${BASE}/rest/v1/${table}${conflict ? `?on_conflict=${conflict}` : ''}`;
  const prefer = conflict ? 'return=representation,resolution=merge-duplicates' : 'return=representation';
  const r = await fetch(url, {
    method: 'POST',
    headers: { ...H, 'Prefer': prefer },
    body: JSON.stringify(rows)
  });
  const d = await r.json();
  if (!Array.isArray(d)) {
    console.error(`  ❌ INSERT ${table} error:`, JSON.stringify(d));
    return [];
  }
  return d;
}

async function patch(table, id, data) {
  const r = await fetch(`${BASE}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...H, 'Prefer': 'return=minimal' },
    body: JSON.stringify(data)
  });
  return r.ok;
}

async function runSql(sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJ}/database/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MGMT}` },
    body: JSON.stringify({ query: sql })
  });
  return { ok: r.ok, status: r.status, data: await r.json() };
}

// ============================================================
// 1. APP SETTINGS - schema: key (text PK), value (jsonb), is_public (bool)
// ============================================================
async function seedAppSettings() {
  console.log('\n📌 Seeding app_settings...');
  const existing = await get('app_settings');
  if (existing.length > 0) {
    console.log(`  ℹ️  Already has ${existing.length} settings`);
    return;
  }
  
  const settings = [
    { key: 'site_name', value: '"1learn.asia"', is_public: true },
    { key: 'site_tagline', value: '"Hướng nghiệp thông minh cho học sinh Việt Nam"', is_public: true },
    { key: 'contact_email', value: '"support@1learn.asia"', is_public: true },
    { key: 'maintenance_mode', value: 'false', is_public: false },
    { key: 'nav_items', value: JSON.stringify(JSON.stringify([
      { label: 'Khám phá Nghề nghiệp', href: '/careers' },
      { label: 'Đại học', href: '/universities' },
      { label: 'Ngành học', href: '/majors' },
      { label: 'Nghề phù hợp', href: '/careers/matches' }
    ])), is_public: true }
  ];
  
  const result = await insert('app_settings', settings, 'key');
  console.log(`  ✅ Inserted ${result.length} settings`);
}

// ============================================================
// 2. ASSESSMENT DIMENSIONS - add framework column then seed
// ============================================================
async function seedAssessmentDimensions() {
  console.log('\n📌 Adding framework column + seeding new dimensions...');
  
  // First add the 'framework' column if it doesn't exist
  const alter = await runSql(`
    ALTER TABLE public.assessment_dimensions 
    ADD COLUMN IF NOT EXISTS framework text NOT NULL DEFAULT 'riasec';
  `);
  if (alter.ok) console.log('  ✅ framework column ensured on assessment_dimensions');
  
  const versions = await get('assessment_versions', 'select=id');
  const versionId = versions[0]?.id;
  if (!versionId) { console.log('  ❌ No assessment version found'); return; }
  
  const existingDims = await get('assessment_dimensions', `version_id=eq.${versionId}&select=code`);
  const existingCodes = new Set(existingDims.map(d => d.code));
  console.log(`  Existing dimension codes: ${[...existingCodes].join(', ')}`);
  
  // Update existing RIASEC dimensions with framework
  await runSql(`UPDATE public.assessment_dimensions SET framework = 'riasec' WHERE framework = 'riasec' OR framework IS NULL`);
  
  const newDims = [
    { version_id: versionId, code: 'O', name: 'Cởi mở (Openness)', description: 'Khả năng sáng tạo và cởi mở với trải nghiệm mới', framework: 'big_five' },
    { version_id: versionId, code: 'C_BF', name: 'Cẩn thận (Conscientiousness)', description: 'Sự có trách nhiệm, có kế hoạch và kiên trì', framework: 'big_five' },
    { version_id: versionId, code: 'EX', name: 'Hướng ngoại (Extraversion)', description: 'Năng lượng xã hội và sự quyết đoán', framework: 'big_five' },
    { version_id: versionId, code: 'AG', name: 'Hòa đồng (Agreeableness)', description: 'Sự hợp tác và tin tưởng người khác', framework: 'big_five' },
    { version_id: versionId, code: 'EM', name: 'Ổn định cảm xúc (Emotional Stability)', description: 'Xu hướng ổn định cảm xúc (thấp = nhiều lo âu)', framework: 'big_five' },
    { version_id: versionId, code: 'WV_ACHIEVE', name: 'Thành tích', description: 'Coi trọng việc đạt được mục tiêu và kết quả', framework: 'work_values' },
    { version_id: versionId, code: 'WV_SOCIAL', name: 'Đóng góp xã hội', description: 'Coi trọng việc giúp đỡ và tác động đến cộng đồng', framework: 'work_values' },
    { version_id: versionId, code: 'WV_AUTONOMY', name: 'Tự chủ', description: 'Coi trọng sự độc lập và tự quyết định', framework: 'work_values' },
    { version_id: versionId, code: 'WV_SECURITY', name: 'An toàn', description: 'Coi trọng sự ổn định và an toàn trong công việc', framework: 'work_values' },
    { version_id: versionId, code: 'WV_CREATIVE', name: 'Sáng tạo', description: 'Coi trọng khả năng sáng tạo và đổi mới', framework: 'work_values' },
  ].filter(d => !existingCodes.has(d.code));
  
  if (newDims.length === 0) { console.log('  ℹ️  All dimensions already exist'); return; }
  
  const inserted = await insert('assessment_dimensions', newDims, 'version_id,code');
  console.log(`  ✅ Inserted ${inserted.length} new dimensions`);
  return { versionId, insertedDims: inserted };
}

// ============================================================
// 3. ASSESSMENT QUESTIONS - Big Five + Work Values
// ============================================================
async function seedAssessmentQuestions(versionId, newDimIds) {
  console.log('\n📌 Seeding Big Five + Work Values questions...');
  
  const allDims = await get('assessment_dimensions', `version_id=eq.${versionId}&select=id,code`);
  const dimMap = Object.fromEntries(allDims.map(d => [d.code, d.id]));
  
  const existingQs = await get('assessment_questions', `version_id=eq.${versionId}&select=id`);
  if (existingQs.length >= 55) {
    console.log(`  ℹ️  Already has ${existingQs.length} questions, skipping`);
    return;
  }
  
  const questionsToInsert = [];
  let orderIdx = 50; // Start after existing RIASEC questions
  
  const bigFive = {
    'O': [
      'Tôi thích thử nghiệm những cách tiếp cận mới và sáng tạo để giải quyết vấn đề.',
      'Tôi thường xuyên khám phá các chủ đề hoặc lĩnh vực mà tôi chưa quen thuộc.',
      'Tôi có trí tưởng tượng phong phú và thích đặt ra những ý tưởng độc đáo.',
      'Tôi thích làm mọi thứ theo một cách cố định và không thích thay đổi.', // reverse
      'Nghệ thuật, âm nhạc hoặc văn chương thường thu hút sự chú ý của tôi.',
    ],
    'C_BF': [
      'Tôi thường hoàn thành nhiệm vụ đúng hạn mà không để công việc tồn đọng.',
      'Tôi lên kế hoạch tỉ mỉ trước khi bắt đầu một dự án quan trọng.',
      'Tôi rất chú ý đến từng chi tiết nhỏ trong công việc của mình.',
      'Tôi thường để đồ đạc lộn xộn và khó tìm thấy thứ cần dùng.', // reverse
      'Tôi kiên trì theo đuổi mục tiêu dù gặp nhiều khó khăn.',
    ],
    'EX': [
      'Tôi cảm thấy tràn đầy năng lượng khi gặp gỡ và trò chuyện với nhiều người.',
      'Tôi thích chủ động bắt chuyện với người mới quen.',
      'Tôi thích các sự kiện xã hội và không khí náo nhiệt hơn là ở nhà một mình.',
      'Sau những buổi gặp gỡ đông người, tôi cảm thấy mệt mỏi và cần thời gian một mình.', // reverse
      'Tôi dễ dàng thể hiện ý kiến và cảm xúc trước đám đông.',
    ],
    'AG': [
      'Tôi luôn cố gắng hiểu quan điểm của người khác trước khi đưa ra ý kiến.',
      'Tôi sẵn lòng thỏa hiệp để duy trì mối quan hệ hòa hảo với mọi người.',
      'Tôi thường cảm thấy đồng cảm với những người đang gặp khó khăn.',
      'Tôi không ngại tranh luận kịch liệt để bảo vệ quan điểm của mình.', // reverse
      'Tôi thường tin tưởng rằng hầu hết mọi người có ý định tốt.',
    ],
    'EM': [
      'Tôi thường giữ được bình tĩnh ngay cả trong những tình huống căng thẳng.',
      'Tôi ít lo lắng về những điều chưa chắc xảy ra.',
      'Tôi cảm thấy ổn định về mặt cảm xúc qua hầu hết các tình huống.',
      'Tôi dễ bị căng thẳng và lo âu khi đối mặt với áp lực.', // reverse
      'Tôi hiếm khi cảm thấy buồn bã hay chán nản mà không rõ lý do.',
    ],
  };

  const workValues = {
    'WV_ACHIEVE': [
      'Việc đặt ra mục tiêu cao và đạt được chúng là điều quan trọng nhất với tôi trong công việc.',
      'Tôi muốn làm việc ở nơi thành tích cá nhân được đánh giá cao và công nhận.',
      'Tôi cảm thấy thỏa mãn khi được giao thêm trách nhiệm và thử thách mới.',
      'Tôi thích môi trường cạnh tranh nơi tôi có thể chứng minh năng lực bản thân.',
    ],
    'WV_SOCIAL': [
      'Điều tôi muốn nhất từ công việc là được đóng góp tích cực cho xã hội.',
      'Tôi muốn công việc của mình trực tiếp giúp đỡ hoặc cải thiện cuộc sống của người khác.',
      'Làm việc cho tổ chức có ý nghĩa xã hội quan trọng hơn với tôi so với mức lương cao.',
      'Tôi sẽ cảm thấy trống rỗng nếu công việc không tạo ra giá trị gì cho cộng đồng.',
    ],
    'WV_AUTONOMY': [
      'Tôi muốn có quyền tự quyết định cách thức và thời điểm hoàn thành công việc của mình.',
      'Tôi không thích bị giám sát chặt chẽ hay phải báo cáo thường xuyên.',
      'Lịch làm việc linh hoạt quan trọng hơn với tôi so với thu nhập ổn định.',
      'Tôi muốn làm việc độc lập hơn là phải phối hợp nhịp nhàng với nhiều người.',
    ],
    'WV_SECURITY': [
      'Một công việc ổn định với thu nhập đảm bảo quan trọng hơn công việc hấp dẫn nhưng rủi ro cao.',
      'Tôi muốn có lộ trình thăng tiến rõ ràng và dự đoán được trong sự nghiệp.',
      'Tôi ưu tiên làm việc tại các công ty lớn, ổn định hơn là startup rủi ro.',
      'Mức thu nhập ổn định qua nhiều năm quan trọng hơn cơ hội kiếm nhiều tiền nhưng bấp bênh.',
    ],
    'WV_CREATIVE': [
      'Công việc phải cho phép tôi thể hiện sự sáng tạo và phong cách cá nhân.',
      'Tôi muốn làm việc ở nơi các ý tưởng mới được khuyến khích và thử nghiệm.',
      'Tôi cảm thấy nhàm chán với công việc lặp đi lặp lại và thiếu sự đổi mới.',
      'Việc tạo ra sản phẩm hoặc giải pháp hoàn toàn mới là điều tôi theo đuổi.',
    ],
  };

  const reverseMap = {
    'O': [false, false, false, true, false],
    'C_BF': [false, false, false, true, false],
    'EX': [false, false, false, true, false],
    'AG': [false, false, false, true, false],
    'EM': [false, false, false, true, false],
    'WV_ACHIEVE': [false, false, false, false],
    'WV_SOCIAL': [false, false, false, false],
    'WV_AUTONOMY': [false, false, false, false],
    'WV_SECURITY': [false, false, false, false],
    'WV_CREATIVE': [false, false, false, false],
  };

  for (const [code, questions] of Object.entries({ ...bigFive, ...workValues })) {
    const dimId = dimMap[code];
    if (!dimId) { console.log(`  ⚠️  No dimension found for code ${code}, skipping`); continue; }
    const reverses = reverseMap[code] || questions.map(() => false);
    questions.forEach((text, i) => {
      questionsToInsert.push({
        version_id: versionId,
        dimension_id: dimId,
        question_text: text,
        is_reverse_scored: reverses[i] || false,
        weight: 1,
        order_index: orderIdx++
      });
    });
  }

  if (questionsToInsert.length === 0) { console.log('  ℹ️  No new questions to insert'); return; }

  // Insert in batches
  for (let i = 0; i < questionsToInsert.length; i += 20) {
    const batch = questionsToInsert.slice(i, i + 20);
    const inserted = await insert('assessment_questions', batch);
    if (inserted.length > 0) {
      // Add 5-point Likert options for each question
      const options = [];
      for (const q of inserted) {
        options.push(
          { question_id: q.id, option_text: 'Hoàn toàn không đồng ý', option_value: 1, order_index: 1 },
          { question_id: q.id, option_text: 'Không đồng ý', option_value: 2, order_index: 2 },
          { question_id: q.id, option_text: 'Trung lập', option_value: 3, order_index: 3 },
          { question_id: q.id, option_text: 'Đồng ý', option_value: 4, order_index: 4 },
          { question_id: q.id, option_text: 'Hoàn toàn đồng ý', option_value: 5, order_index: 5 }
        );
      }
      await insert('assessment_question_options', options);
      console.log(`  ✅ Inserted ${inserted.length} questions + options (batch ${Math.floor(i/20)+1})`);
    }
  }
}

// ============================================================
// 4. UNIVERSITIES
// ============================================================
async function seedUniversities() {
  console.log('\n📌 Seeding more universities...');
  const existing = await get('universities', 'select=slug');
  const existingSlugs = new Set(existing.map(u => u.slug));
  
  const universities = [
    { name: 'Đại học Bách Khoa Hà Nội', short_name: 'HUST', slug: 'hust', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Quốc gia Hà Nội', short_name: 'VNU-HN', slug: 'vnu-hn', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Kinh tế Quốc dân', short_name: 'NEU', slug: 'neu', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Ngoại thương Hà Nội', short_name: 'FTU', slug: 'ftu', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Học viện Công nghệ Bưu chính Viễn thông', short_name: 'PTIT', slug: 'ptit', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Sư phạm Hà Nội', short_name: 'HNUE', slug: 'hnue', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Y Hà Nội', short_name: 'HMU', slug: 'hmu', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Xây dựng Hà Nội', short_name: 'HUCE', slug: 'huce', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Công nghệ Thông tin TP.HCM', short_name: 'UIT', slug: 'uit', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Y Dược TP.HCM', short_name: 'UMP', slug: 'ump', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Sư phạm TP.HCM', short_name: 'HCMUE', slug: 'hcmue', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Tôn Đức Thắng', short_name: 'TDTU', slug: 'tdtu', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Nguyễn Tất Thành', short_name: 'NTT', slug: 'ntt', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'private', scale: 'medium', status: 'published' },
    { name: 'Đại học Hoa Sen', short_name: 'HSU', slug: 'hsu', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'private', scale: 'medium', status: 'published' },
    { name: 'Đại học Đà Nẵng', short_name: 'UD', slug: 'ud', location_city: 'Đà Nẵng', location_region: 'Central', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Bách Khoa Đà Nẵng', short_name: 'DUT', slug: 'dut', location_city: 'Đà Nẵng', location_region: 'Central', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Kinh tế Đà Nẵng', short_name: 'DUE', slug: 'due', location_city: 'Đà Nẵng', location_region: 'Central', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Cần Thơ', short_name: 'CTU', slug: 'ctu', location_city: 'Cần Thơ', location_region: 'South', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học VinUni', short_name: 'VinUni', slug: 'vinuni', location_city: 'Hà Nội', location_region: 'North', type: 'private', scale: 'small', status: 'published' },
    { name: 'British University Vietnam', short_name: 'BUV', slug: 'buv', location_city: 'Hà Nội', location_region: 'North', type: 'international', scale: 'small', status: 'published' },
    { name: 'Đại học Phenikaa', short_name: 'Phenikaa', slug: 'phenikaa', location_city: 'Hà Nội', location_region: 'North', type: 'private', scale: 'medium', status: 'published' },
    { name: 'Đại học Luật Hà Nội', short_name: 'HLU', slug: 'hlu', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Luật TP.HCM', short_name: 'HCMLAW', slug: 'hcmlaw', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Văn Lang', short_name: 'VLU', slug: 'vlu', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'private', scale: 'medium', status: 'published' },
    { name: 'Đại học Gia Định', short_name: 'GDU', slug: 'gdu', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'private', scale: 'small', status: 'published' },
  ];

  const toInsert = universities.filter(u => !existingSlugs.has(u.slug));
  if (toInsert.length === 0) { console.log('  ℹ️  All universities already exist'); return; }
  
  for (let i = 0; i < toInsert.length; i += 20) {
    const batch = toInsert.slice(i, i + 20);
    const r = await insert('universities', batch, 'slug');
    console.log(`  ✅ Inserted ${r.length} universities`);
  }
}

// ============================================================
// 5. MAJORS
// ============================================================
async function seedMajors() {
  console.log('\n📌 Seeding more majors...');
  const existing = await get('majors', 'select=slug');
  const existingSlugs = new Set(existing.map(m => m.slug));
  
  const majors = [
    { name: 'Công nghệ thông tin', code: '7480201', slug: 'cong-nghe-thong-tin', field: 'Technology', status: 'published' },
    { name: 'An toàn thông tin', code: '7480202', slug: 'an-toan-thong-tin', field: 'Technology', status: 'published' },
    { name: 'Hệ thống thông tin', code: '7480104', slug: 'he-thong-thong-tin', field: 'Technology', status: 'published' },
    { name: 'Trí tuệ nhân tạo', code: '7480107', slug: 'tri-tue-nhan-tao', field: 'Technology', status: 'published' },
    { name: 'Khoa học dữ liệu', code: '7460108', slug: 'khoa-hoc-du-lieu', field: 'Technology', status: 'published' },
    { name: 'Kỹ thuật điện tử viễn thông', code: '7520207', slug: 'ky-thuat-dien-tu-vien-thong', field: 'Engineering', status: 'published' },
    { name: 'Kỹ thuật điện', code: '7520201', slug: 'ky-thuat-dien', field: 'Engineering', status: 'published' },
    { name: 'Kỹ thuật cơ khí', code: '7520103', slug: 'ky-thuat-co-khi', field: 'Engineering', status: 'published' },
    { name: 'Kỹ thuật xây dựng', code: '7580201', slug: 'ky-thuat-xay-dung', field: 'Engineering', status: 'published' },
    { name: 'Kỹ thuật môi trường', code: '7520320', slug: 'ky-thuat-moi-truong', field: 'Engineering', status: 'published' },
    { name: 'Kỹ thuật hóa học', code: '7520301', slug: 'ky-thuat-hoa-hoc', field: 'Engineering', status: 'published' },
    { name: 'Công nghệ sinh học', code: '7420201', slug: 'cong-nghe-sinh-hoc', field: 'Science', status: 'published' },
    { name: 'Tài chính Ngân hàng', code: '7340201', slug: 'tai-chinh-ngan-hang', field: 'Business', status: 'published' },
    { name: 'Kế toán', code: '7340301', slug: 'ke-toan', field: 'Business', status: 'published' },
    { name: 'Kiểm toán', code: '7340302', slug: 'kiem-toan', field: 'Business', status: 'published' },
    { name: 'Thương mại điện tử', code: '7340122', slug: 'thuong-mai-dien-tu', field: 'Business', status: 'published' },
    { name: 'Logistics và Quản lý chuỗi cung ứng', code: '7510605', slug: 'logistics-chuoi-cung-ung', field: 'Business', status: 'published' },
    { name: 'Quản trị dịch vụ du lịch lữ hành', code: '7810103', slug: 'quan-tri-du-lich-lu-hanh', field: 'Business', status: 'published' },
    { name: 'Quản trị khách sạn', code: '7810201', slug: 'quan-tri-khach-san', field: 'Business', status: 'published' },
    { name: 'Luật', code: '7380101', slug: 'luat', field: 'Law', status: 'published' },
    { name: 'Luật kinh tế', code: '7380107', slug: 'luat-kinh-te', field: 'Law', status: 'published' },
    { name: 'Quan hệ quốc tế', code: '7310601', slug: 'quan-he-quoc-te', field: 'Social', status: 'published' },
    { name: 'Ngôn ngữ Anh', code: '7220201', slug: 'ngon-ngu-anh', field: 'Humanities', status: 'published' },
    { name: 'Ngôn ngữ Nhật', code: '7220209', slug: 'ngon-ngu-nhat', field: 'Humanities', status: 'published' },
    { name: 'Ngôn ngữ Trung Quốc', code: '7220204', slug: 'ngon-ngu-trung-quoc', field: 'Humanities', status: 'published' },
    { name: 'Báo chí', code: '7320101', slug: 'bao-chi', field: 'Humanities', status: 'published' },
    { name: 'Truyền thông đa phương tiện', code: '7320104', slug: 'truyen-thong-da-phuong-tien', field: 'Humanities', status: 'published' },
    { name: 'Tâm lý học', code: '7310401', slug: 'tam-ly-hoc', field: 'Social', status: 'published' },
    { name: 'Công tác xã hội', code: '7760101', slug: 'cong-tac-xa-hoi', field: 'Social', status: 'published' },
    { name: 'Y khoa', code: '7720101', slug: 'y-khoa', field: 'Health', status: 'published' },
    { name: 'Dược học', code: '7720201', slug: 'duoc-hoc', field: 'Health', status: 'published' },
    { name: 'Điều dưỡng', code: '7720301', slug: 'dieu-duong', field: 'Health', status: 'published' },
    { name: 'Răng Hàm Mặt', code: '7720501', slug: 'rang-ham-mat', field: 'Health', status: 'published' },
    { name: 'Thiết kế đồ họa', code: '7210403', slug: 'thiet-ke-do-hoa', field: 'Design', status: 'published' },
    { name: 'Kiến trúc', code: '7580101', slug: 'kien-truc', field: 'Design', status: 'published' },
    { name: 'Thiết kế nội thất', code: '7580109', slug: 'thiet-ke-noi-that', field: 'Design', status: 'published' },
    { name: 'Sư phạm Toán học', code: '7140209', slug: 'su-pham-toan-hoc', field: 'Education', status: 'published' },
    { name: 'Sư phạm Tiếng Anh', code: '7140231', slug: 'su-pham-tieng-anh', field: 'Education', status: 'published' },
    { name: 'Giáo dục Mầm non', code: '7140201', slug: 'giao-duc-mam-non', field: 'Education', status: 'published' },
    { name: 'Nông nghiệp', code: '7620101', slug: 'nong-nghiep', field: 'Agriculture', status: 'published' },
    { name: 'Thú y', code: '7640101', slug: 'thu-y', field: 'Agriculture', status: 'published' },
    { name: 'Khoa học môi trường', code: '7440301', slug: 'khoa-hoc-moi-truong', field: 'Science', status: 'published' },
    { name: 'Bảo hiểm', code: '7340204', slug: 'bao-hiem', field: 'Business', status: 'published' },
    { name: 'Mỹ thuật ứng dụng', code: '7210101', slug: 'my-thuat-ung-dung', field: 'Design', status: 'published' },
    { name: 'Kinh tế học', code: '7310101', slug: 'kinh-te-hoc', field: 'Business', status: 'published' },
  ];

  const toInsert = majors.filter(m => !existingSlugs.has(m.slug));
  if (toInsert.length === 0) { console.log('  ℹ️  All majors already exist'); return; }
  
  for (let i = 0; i < toInsert.length; i += 20) {
    const r = await insert('majors', toInsert.slice(i, i + 20), 'slug');
    console.log(`  ✅ Inserted ${r.length} majors`);
  }
}

// ============================================================
// 6. CAREERS: Update RIASEC profiles via bulk SQL
// ============================================================
async function updateCareersRiasec() {
  console.log('\n📌 Updating careers with RIASEC profiles via bulk SQL...');
  
  // Use domain-code based mapping executed directly in DB
  const sql = `
    UPDATE public.careers
    SET 
      riasec_profile = CASE
        WHEN career_domain_code ILIKE '%tech%' OR career_domain_code ILIKE '%it%' OR career_domain_code ILIKE '%sw%' OR career_domain_code ILIKE '%comp%' 
          THEN '{"R": 0.25, "I": 0.88, "A": 0.30, "S": 0.20, "E": 0.38, "C": 0.65}'::jsonb
        WHEN career_domain_code ILIKE '%eng%' OR career_domain_code ILIKE '%engi%'
          THEN '{"R": 0.72, "I": 0.80, "A": 0.22, "S": 0.22, "E": 0.30, "C": 0.55}'::jsonb
        WHEN career_domain_code ILIKE '%fin%' OR career_domain_code ILIKE '%acc%' OR career_domain_code ILIKE '%bank%'
          THEN '{"R": 0.12, "I": 0.68, "A": 0.12, "S": 0.32, "E": 0.72, "C": 0.88}'::jsonb
        WHEN career_domain_code ILIKE '%mkt%' OR career_domain_code ILIKE '%market%' OR career_domain_code ILIKE '%sale%'
          THEN '{"R": 0.12, "I": 0.48, "A": 0.62, "S": 0.60, "E": 0.88, "C": 0.40}'::jsonb
        WHEN career_domain_code ILIKE '%mgmt%' OR career_domain_code ILIKE '%biz%' OR career_domain_code ILIKE '%mgm%'
          THEN '{"R": 0.18, "I": 0.48, "A": 0.20, "S": 0.68, "E": 0.88, "C": 0.58}'::jsonb
        WHEN career_domain_code ILIKE '%med%' OR career_domain_code ILIKE '%health%' OR career_domain_code ILIKE '%doc%'
          THEN '{"R": 0.40, "I": 0.80, "A": 0.22, "S": 0.88, "E": 0.40, "C": 0.60}'::jsonb
        WHEN career_domain_code ILIKE '%edu%' OR career_domain_code ILIKE '%teach%'
          THEN '{"R": 0.20, "I": 0.52, "A": 0.50, "S": 0.90, "E": 0.42, "C": 0.42}'::jsonb
        WHEN career_domain_code ILIKE '%law%' OR career_domain_code ILIKE '%legal%'
          THEN '{"R": 0.12, "I": 0.72, "A": 0.30, "S": 0.60, "E": 0.80, "C": 0.72}'::jsonb
        WHEN career_domain_code ILIKE '%art%' OR career_domain_code ILIKE '%design%' OR career_domain_code ILIKE '%graph%'
          THEN '{"R": 0.32, "I": 0.45, "A": 0.90, "S": 0.50, "E": 0.48, "C": 0.28}'::jsonb
        WHEN career_domain_code ILIKE '%sci%' OR career_domain_code ILIKE '%research%'
          THEN '{"R": 0.32, "I": 0.90, "A": 0.30, "S": 0.32, "E": 0.30, "C": 0.72}'::jsonb
        WHEN career_domain_code ILIKE '%agr%' OR career_domain_code ILIKE '%farm%'
          THEN '{"R": 0.80, "I": 0.60, "A": 0.30, "S": 0.42, "E": 0.40, "C": 0.52}'::jsonb
        WHEN career_domain_code ILIKE '%soc%' OR career_domain_code ILIKE '%social%'
          THEN '{"R": 0.12, "I": 0.42, "A": 0.32, "S": 0.90, "E": 0.42, "C": 0.32}'::jsonb
        ELSE '{"R": 0.50, "I": 0.50, "A": 0.30, "S": 0.50, "E": 0.50, "C": 0.50}'::jsonb
      END,
      riasec_primary = CASE
        WHEN career_domain_code ILIKE '%tech%' OR career_domain_code ILIKE '%it%' OR career_domain_code ILIKE '%sw%' OR career_domain_code ILIKE '%comp%' THEN 'I'
        WHEN career_domain_code ILIKE '%eng%' THEN 'I'
        WHEN career_domain_code ILIKE '%fin%' OR career_domain_code ILIKE '%acc%' OR career_domain_code ILIKE '%bank%' THEN 'C'
        WHEN career_domain_code ILIKE '%mkt%' OR career_domain_code ILIKE '%market%' OR career_domain_code ILIKE '%sale%' THEN 'E'
        WHEN career_domain_code ILIKE '%mgmt%' OR career_domain_code ILIKE '%biz%' THEN 'E'
        WHEN career_domain_code ILIKE '%med%' OR career_domain_code ILIKE '%health%' THEN 'S'
        WHEN career_domain_code ILIKE '%edu%' OR career_domain_code ILIKE '%teach%' THEN 'S'
        WHEN career_domain_code ILIKE '%law%' OR career_domain_code ILIKE '%legal%' THEN 'E'
        WHEN career_domain_code ILIKE '%art%' OR career_domain_code ILIKE '%design%' THEN 'A'
        WHEN career_domain_code ILIKE '%sci%' OR career_domain_code ILIKE '%research%' THEN 'I'
        WHEN career_domain_code ILIKE '%agr%' OR career_domain_code ILIKE '%farm%' THEN 'R'
        WHEN career_domain_code ILIKE '%soc%' OR career_domain_code ILIKE '%social%' THEN 'S'
        ELSE 'C'
      END,
      ability_weights = CASE
        WHEN career_domain_code ILIKE '%tech%' OR career_domain_code ILIKE '%it%' OR career_domain_code ILIKE '%sw%'
          THEN '{"logical": 0.9, "spatial": 0.4, "verbal": 0.4, "numerical": 0.8, "creative": 0.6, "interpersonal": 0.3}'::jsonb
        WHEN career_domain_code ILIKE '%eng%'
          THEN '{"logical": 0.9, "spatial": 0.8, "verbal": 0.4, "numerical": 0.9, "creative": 0.5, "interpersonal": 0.3}'::jsonb
        WHEN career_domain_code ILIKE '%fin%' OR career_domain_code ILIKE '%acc%'
          THEN '{"logical": 0.8, "spatial": 0.2, "verbal": 0.6, "numerical": 0.9, "creative": 0.3, "interpersonal": 0.5}'::jsonb
        WHEN career_domain_code ILIKE '%mkt%' OR career_domain_code ILIKE '%market%'
          THEN '{"logical": 0.6, "spatial": 0.5, "verbal": 0.9, "numerical": 0.6, "creative": 0.8, "interpersonal": 0.8}'::jsonb
        WHEN career_domain_code ILIKE '%med%' OR career_domain_code ILIKE '%health%'
          THEN '{"logical": 0.8, "spatial": 0.7, "verbal": 0.7, "numerical": 0.7, "creative": 0.4, "interpersonal": 0.9}'::jsonb
        WHEN career_domain_code ILIKE '%edu%' OR career_domain_code ILIKE '%teach%'
          THEN '{"logical": 0.6, "spatial": 0.4, "verbal": 0.9, "numerical": 0.5, "creative": 0.6, "interpersonal": 0.9}'::jsonb
        WHEN career_domain_code ILIKE '%law%'
          THEN '{"logical": 0.9, "spatial": 0.2, "verbal": 0.9, "numerical": 0.5, "creative": 0.5, "interpersonal": 0.8}'::jsonb
        WHEN career_domain_code ILIKE '%art%' OR career_domain_code ILIKE '%design%'
          THEN '{"logical": 0.4, "spatial": 0.9, "verbal": 0.5, "numerical": 0.3, "creative": 0.9, "interpersonal": 0.6}'::jsonb
        ELSE '{"logical": 0.5, "spatial": 0.5, "verbal": 0.5, "numerical": 0.5, "creative": 0.5, "interpersonal": 0.5}'::jsonb
      END
    WHERE riasec_profile IS NULL;
  `;
  
  const result = await runSql(sql);
  if (result.ok) {
    console.log(`  ✅ Updated careers with RIASEC profiles (status: ${result.status})`);
  } else {
    console.log(`  ❌ Failed: ${JSON.stringify(result.data)}`);
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('='.repeat(60));
  console.log('1LEARN.ASIA — PRODUCTION SEED v2');
  console.log('='.repeat(60));
  
  await seedAppSettings();
  const dimResult = await seedAssessmentDimensions();
  if (dimResult) {
    await seedAssessmentQuestions(dimResult.versionId, dimResult.insertedDims);
  } else {
    // Still try to seed questions with existing version
    const versions = await get('assessment_versions', 'select=id');
    if (versions[0]) {
      await seedAssessmentQuestions(versions[0].id, []);
    }
  }
  await seedUniversities();
  await seedMajors();
  await updateCareersRiasec();
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  const [qs, unis, majs, careers] = await Promise.all([
    get('assessment_questions', 'select=id'),
    get('universities', 'select=id'),
    get('majors', 'select=id'),
    get('careers', 'select=id&status=eq.published'),
  ]);
  console.log(`📊 FINAL COUNTS:`);
  console.log(`   Assessment questions: ${qs.length}`);
  console.log(`   Universities: ${unis.length}`);
  console.log(`   Majors: ${majs.length}`);
  console.log(`   Careers (published): ${careers.length}`);
  console.log('✅ SEED COMPLETE');
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
