/**
 * Seed Script: Assessment Questions + app_settings + riasec_profile for careers
 * Connects directly to Supabase via Management API
 * 
 * Run: node scripts/seed_production_data.mjs
 */

const SUPABASE_URL = 'https://cbhkrijxgqedcxywuwut.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN || '';
const PROJECT_REF = 'cbhkrijxgqedcxywuwut';

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function upsert(table, data, onConflict = null) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const prefer = onConflict 
    ? `return=representation,resolution=merge-duplicates` 
    : 'return=representation';
  const res = await fetch(url + (onConflict ? `?on_conflict=${onConflict}` : ''), {
    method: 'POST',
    headers: { ...headers, 'Prefer': prefer },
    body: JSON.stringify(data)
  });
  const d = await res.json();
  if (!Array.isArray(d)) {
    console.error(`Error upserting ${table}:`, JSON.stringify(d));
    return null;
  }
  return d;
}

async function runSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MGMT_TOKEN}`
    },
    body: JSON.stringify({ query: sql })
  });
  const d = await res.json();
  return { status: res.status, data: d };
}

async function select(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
  return res.json();
}

// ============================================================
// 1. SEED app_settings (required for CMS/branding to work)
// ============================================================
async function seedAppSettings() {
  console.log('\n📌 Seeding app_settings...');
  
  // Check if settings exist first
  const existing = await select('app_settings');
  if (existing && existing.length > 0) {
    console.log(`  ℹ️  app_settings already has ${existing.length} rows, skipping.`);
    return;
  }

  const settings = [
    { key: 'site_name', value: '"1learn.asia"', description: 'Site name', is_public: true },
    { key: 'site_tagline', value: '"Hướng nghiệp thông minh cho học sinh Việt Nam"', description: 'Site tagline', is_public: true },
    { key: 'site_logo_url', value: '""', description: 'Logo URL', is_public: true },
    { key: 'primary_color', value: '"#3B82F6"', description: 'Primary brand color', is_public: true },
    { key: 'contact_email', value: '"support@1learn.asia"', description: 'Contact email', is_public: true },
    { key: 'maintenance_mode', value: 'false', description: 'Maintenance mode toggle', is_public: false },
    { key: 'max_assessment_retakes', value: '3', description: 'Max times student can retake assessment', is_public: false },
    { key: 'nav_items', value: JSON.stringify(JSON.stringify([
      { label: 'Khám phá Nghề nghiệp', href: '/careers' },
      { label: 'Đại học', href: '/universities' },
      { label: 'Ngành học', href: '/majors' },
      { label: 'Hướng nghiệp', href: '/careers/matches' }
    ])), description: 'Navigation items', is_public: true }
  ];

  const result = await upsert('app_settings', settings, 'key');
  if (result) {
    console.log(`  ✅ Inserted ${result.length} app_settings rows`);
  }
}

// ============================================================
// 2. SEED ASSESSMENT: Add Big Five + Work Values dimensions + questions
// ============================================================
async function seedAssessmentData() {
  console.log('\n📌 Seeding additional assessment questions...');
  
  // Get existing version
  const versions = await select('assessment_versions', 'select=id,scoring_rules_version');
  if (!versions || versions.length === 0) {
    console.log('  ❌ No assessment version found, cannot seed questions');
    return;
  }
  const versionId = versions[0].id;
  console.log(`  Using version: ${versionId}`);

  // Check current dimensions
  const existingDims = await select('assessment_dimensions', `version_id=eq.${versionId}&select=id,code,framework`);
  console.log(`  Existing dimensions: ${existingDims?.map(d => d.code).join(', ')}`);

  // Check if Big Five dimensions already exist
  const hasBigFive = existingDims?.some(d => d.framework === 'big_five');
  const hasWorkValues = existingDims?.some(d => d.framework === 'work_values');

  const newDimensions = [];
  
  if (!hasBigFive) {
    newDimensions.push(
      { version_id: versionId, code: 'O', name: 'Cởi mở (Openness)', framework: 'big_five', weight: 1.0, order_index: 7, description: 'Khả năng sáng tạo và cởi mở với trải nghiệm mới' },
      { version_id: versionId, code: 'C', name: 'Cẩn thận (Conscientiousness)', framework: 'big_five', weight: 1.0, order_index: 8, description: 'Sự có trách nhiệm, có kế hoạch và kiên trì' },
      { version_id: versionId, code: 'E', name: 'Hướng ngoại (Extraversion)', framework: 'big_five', weight: 1.0, order_index: 9, description: 'Năng lượng xã hội và sự quyết đoán' },
      { version_id: versionId, code: 'A', name: 'Hòa đồng (Agreeableness)', framework: 'big_five', weight: 1.0, order_index: 10, description: 'Sự hợp tác và tin tưởng người khác' },
      { version_id: versionId, code: 'N', name: 'Ổn định cảm xúc (Neuroticism)', framework: 'big_five', weight: 1.0, order_index: 11, description: 'Xu hướng trải qua cảm xúc tiêu cực', is_reverse_framework: true }
    );
  }
  
  if (!hasWorkValues) {
    newDimensions.push(
      { version_id: versionId, code: 'WV_ACHIEVE', name: 'Thành tích', framework: 'work_values', weight: 1.0, order_index: 12, description: 'Coi trọng việc đạt được mục tiêu và kết quả' },
      { version_id: versionId, code: 'WV_SOCIAL', name: 'Đóng góp xã hội', framework: 'work_values', weight: 1.0, order_index: 13, description: 'Coi trọng việc giúp đỡ và tác động đến cộng đồng' },
      { version_id: versionId, code: 'WV_AUTONOMY', name: 'Tự chủ', framework: 'work_values', weight: 1.0, order_index: 14, description: 'Coi trọng sự độc lập và tự quyết định trong công việc' },
      { version_id: versionId, code: 'WV_SECURITY', name: 'An toàn', framework: 'work_values', weight: 1.0, order_index: 15, description: 'Coi trọng sự ổn định và an toàn trong công việc' },
      { version_id: versionId, code: 'WV_CREATIVE', name: 'Sáng tạo', framework: 'work_values', weight: 1.0, order_index: 16, description: 'Coi trọng khả năng sáng tạo và đổi mới' }
    );
  }
  
  let insertedDims = [];
  if (newDimensions.length > 0) {
    insertedDims = await upsert('assessment_dimensions', newDimensions, 'version_id,code') || [];
    console.log(`  ✅ Inserted ${insertedDims.length} new dimensions`);
  }
  
  const allDims = await select('assessment_dimensions', `version_id=eq.${versionId}&select=id,code`);
  const dimMap = Object.fromEntries(allDims.map(d => [d.code, d.id]));

  // Check existing questions count
  const existingQs = await select('assessment_questions', `version_id=eq.${versionId}&select=id`);
  console.log(`  Existing questions: ${existingQs?.length}`);

  if (existingQs && existingQs.length >= 60) {
    console.log('  ℹ️  Already has 60+ questions, skipping question seeding');
    return;
  }

  // Big Five Questions (5 per dimension = 25 total)
  const bigFiveQuestions = [];
  
  if (dimMap['O']) {
    const opennesQs = [
      { text: 'Tôi thích thử nghiệm những cách tiếp cận mới và sáng tạo để giải quyết vấn đề.', reverse: false },
      { text: 'Tôi thường xuyên khám phá các chủ đề hoặc lĩnh vực mà tôi không quen thuộc.', reverse: false },
      { text: 'Tôi thích nghệ thuật, âm nhạc hoặc văn học hơn là các hoạt động thực tế.', reverse: false },
      { text: 'Tôi thích làm những việc theo một cách cố định, không thích thay đổi.', reverse: true },
      { text: 'Tôi có trí tưởng tượng phong phú và thường mơ mộng về những ý tưởng độc đáo.', reverse: false },
    ];
    opennesQs.forEach((q, i) => bigFiveQuestions.push({
      version_id: versionId, dimension_id: dimMap['O'],
      question_text: q.text, is_reverse_scored: q.reverse, weight: 1, order_index: 100 + i
    }));
  }

  if (dimMap['C']) {
    const consQs = [
      { text: 'Tôi thường hoàn thành nhiệm vụ đúng hạn và không để công việc tồn đọng.', reverse: false },
      { text: 'Tôi lên kế hoạch tỉ mỉ trước khi bắt đầu một dự án quan trọng.', reverse: false },
      { text: 'Tôi chú ý đến từng chi tiết nhỏ trong công việc.', reverse: false },
      { text: 'Tôi thường để đồ đạc lộn xộn và khó tìm thấy thứ cần dùng.', reverse: true },
      { text: 'Tôi kiên trì theo đuổi mục tiêu dù gặp nhiều khó khăn.', reverse: false },
    ];
    consQs.forEach((q, i) => bigFiveQuestions.push({
      version_id: versionId, dimension_id: dimMap['C'],
      question_text: q.text, is_reverse_scored: q.reverse, weight: 1, order_index: 110 + i
    }));
  }

  if (dimMap['E']) {
    const extraQs = [
      { text: 'Tôi cảm thấy tràn đầy năng lượng khi ở trong đám đông và gặp gỡ người mới.', reverse: false },
      { text: 'Tôi là người hay chủ động bắt chuyện với người lạ.', reverse: false },
      { text: 'Tôi thích các buổi tiệc và sự kiện xã hội hơn là ở nhà một mình.', reverse: false },
      { text: 'Sau những buổi gặp gỡ xã hội, tôi cảm thấy mệt mỏi và cần thời gian một mình.', reverse: true },
      { text: 'Tôi dễ dàng thể hiện cảm xúc và ý kiến trước nhiều người.', reverse: false },
    ];
    extraQs.forEach((q, i) => bigFiveQuestions.push({
      version_id: versionId, dimension_id: dimMap['E'],
      question_text: q.text, is_reverse_scored: q.reverse, weight: 1, order_index: 120 + i
    }));
  }

  if (dimMap['A']) {
    const agreeQs = [
      { text: 'Tôi luôn cố gắng hiểu quan điểm của người khác trước khi phán xét.', reverse: false },
      { text: 'Tôi sẵn lòng thỏa hiệp để duy trì mối quan hệ hòa hảo.', reverse: false },
      { text: 'Tôi thường cảm thấy đồng cảm với những người đang gặp khó khăn.', reverse: false },
      { text: 'Tôi không ngại tranh luận gay gắt để bảo vệ quan điểm của mình, kể cả làm tổn thương người khác.', reverse: true },
      { text: 'Tôi tin tưởng hầu hết mọi người có ý tốt.', reverse: false },
    ];
    agreeQs.forEach((q, i) => bigFiveQuestions.push({
      version_id: versionId, dimension_id: dimMap['A'],
      question_text: q.text, is_reverse_scored: q.reverse, weight: 1, order_index: 130 + i
    }));
  }

  if (dimMap['N']) {
    const neuroQs = [
      { text: 'Tôi thường lo lắng về nhiều thứ, kể cả những việc không đáng lo.', reverse: false },
      { text: 'Tôi dễ bị căng thẳng khi gặp áp lực từ công việc hoặc học tập.', reverse: false },
      { text: 'Tôi dễ cảm thấy bất ổn và biến động cảm xúc.', reverse: false },
      { text: 'Tôi thường giữ được bình tĩnh ngay cả trong những tình huống căng thẳng.', reverse: true },
      { text: 'Tôi thường xuyên cảm thấy không vui hay chán nản dù không rõ lý do.', reverse: false },
    ];
    neuroQs.forEach((q, i) => bigFiveQuestions.push({
      version_id: versionId, dimension_id: dimMap['N'],
      question_text: q.text, is_reverse_scored: q.reverse, weight: 1, order_index: 140 + i
    }));
  }

  // Work Values Questions (4 per dimension = 20 total)
  const workValuesQuestions = [];

  if (dimMap['WV_ACHIEVE']) {
    const qs = [
      'Việc đặt ra mục tiêu cao và đạt được chúng là điều quan trọng nhất với tôi trong công việc.',
      'Tôi muốn làm việc ở nơi thành tích và kết quả được đánh giá cao và công nhận.',
      'Tôi cảm thấy thoải mái khi được giao thêm trách nhiệm và thử thách mới.',
      'Tôi thích môi trường làm việc cạnh tranh, nơi tôi có thể chứng minh năng lực.',
    ];
    qs.forEach((text, i) => workValuesQuestions.push({
      version_id: versionId, dimension_id: dimMap['WV_ACHIEVE'],
      question_text: text, is_reverse_scored: false, weight: 1, order_index: 150 + i
    }));
  }

  if (dimMap['WV_SOCIAL']) {
    const qs = [
      'Điều tôi muốn nhất từ công việc là được đóng góp tích cực cho xã hội.',
      'Tôi muốn công việc của mình trực tiếp giúp đỡ hoặc cải thiện cuộc sống của người khác.',
      'Làm việc cho một tổ chức có ý nghĩa xã hội quan trọng hơn là mức lương cao.',
      'Tôi sẽ cảm thấy trống rỗng nếu công việc không tạo ra giá trị gì cho cộng đồng.',
    ];
    qs.forEach((text, i) => workValuesQuestions.push({
      version_id: versionId, dimension_id: dimMap['WV_SOCIAL'],
      question_text: text, is_reverse_scored: false, weight: 1, order_index: 160 + i
    }));
  }

  if (dimMap['WV_AUTONOMY']) {
    const qs = [
      'Tôi muốn có toàn quyền quyết định cách thức và thời điểm hoàn thành công việc.',
      'Tôi không thích bị giám sát chặt chẽ hay phải báo cáo thường xuyên.',
      'Một lịch làm việc linh hoạt quan trọng hơn với tôi so với thu nhập ổn định.',
      'Tôi muốn làm việc độc lập hơn là phải phối hợp với nhiều người.',
    ];
    qs.forEach((text, i) => workValuesQuestions.push({
      version_id: versionId, dimension_id: dimMap['WV_AUTONOMY'],
      question_text: text, is_reverse_scored: false, weight: 1, order_index: 170 + i
    }));
  }

  if (dimMap['WV_SECURITY']) {
    const qs = [
      'Một công việc ổn định với thu nhập đảm bảo quan trọng hơn công việc hấp dẫn nhưng rủi ro cao.',
      'Tôi muốn có một lộ trình thăng tiến rõ ràng và dự đoán được trong sự nghiệp.',
      'Tôi ưu tiên làm việc tại các công ty lớn, ổn định hơn là startup.',
      'Mức thu nhập ổn định qua nhiều năm quan trọng hơn cơ hội kiếm nhiều tiền nhưng không ổn định.',
    ];
    qs.forEach((text, i) => workValuesQuestions.push({
      version_id: versionId, dimension_id: dimMap['WV_SECURITY'],
      question_text: text, is_reverse_scored: false, weight: 1, order_index: 180 + i
    }));
  }

  if (dimMap['WV_CREATIVE']) {
    const qs = [
      'Công việc phải cho phép tôi thể hiện sự sáng tạo và phong cách cá nhân.',
      'Tôi muốn làm việc ở nơi các ý tưởng mới được khuyến khích và thử nghiệm.',
      'Tôi cảm thấy nhàm chán với công việc lặp đi lặp lại và thiếu sự đổi mới.',
      'Việc tạo ra sản phẩm hoặc giải pháp hoàn toàn mới là điều tôi theo đuổi.',
    ];
    qs.forEach((text, i) => workValuesQuestions.push({
      version_id: versionId, dimension_id: dimMap['WV_CREATIVE'],
      question_text: text, is_reverse_scored: false, weight: 1, order_index: 190 + i
    }));
  }

  const allNewQuestions = [...bigFiveQuestions, ...workValuesQuestions];
  
  if (allNewQuestions.length > 0) {
    // Insert in batches of 20
    for (let i = 0; i < allNewQuestions.length; i += 20) {
      const batch = allNewQuestions.slice(i, i + 20);
      const inserted = await upsert('assessment_questions', batch);
      if (inserted) {
        console.log(`  ✅ Inserted ${inserted.length} questions (batch ${Math.floor(i/20)+1})`);
        
        // For each inserted question, add 5-point Likert options
        for (const q of inserted) {
          const options = [
            { question_id: q.id, option_text: 'Hoàn toàn không đồng ý', option_value: 1, order_index: 1 },
            { question_id: q.id, option_text: 'Không đồng ý', option_value: 2, order_index: 2 },
            { question_id: q.id, option_text: 'Trung lập', option_value: 3, order_index: 3 },
            { question_id: q.id, option_text: 'Đồng ý', option_value: 4, order_index: 4 },
            { question_id: q.id, option_text: 'Hoàn toàn đồng ý', option_value: 5, order_index: 5 },
          ];
          await upsert('assessment_question_options', options);
        }
      }
    }
  }
}

// ============================================================
// 3. SEED Universities (20+ thêm)
// ============================================================
async function seedUniversities() {
  console.log('\n📌 Seeding more universities...');
  
  const existing = await select('universities', 'select=slug');
  const existingSlugs = new Set(existing?.map(u => u.slug) || []);
  
  const universities = [
    // Hà Nội
    { name: 'Đại học Bách Khoa Hà Nội', short_name: 'HUST', slug: 'hust', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Quốc gia Hà Nội', short_name: 'VNU-HN', slug: 'vnu-hn', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Kinh tế Quốc dân', short_name: 'NEU', slug: 'neu', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Ngoại thương Hà Nội', short_name: 'FTU', slug: 'ftu', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Học viện Công nghệ Bưu chính Viễn thông (PTIT)', short_name: 'PTIT', slug: 'ptit', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Sư phạm Hà Nội', short_name: 'HNUE', slug: 'hnue', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Y Hà Nội', short_name: 'HMU', slug: 'hmu', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Xây dựng Hà Nội', short_name: 'HUCE', slug: 'huce', location_city: 'Hà Nội', location_region: 'North', type: 'public', scale: 'medium', status: 'published' },
    // Hồ Chí Minh
    { name: 'Đại học Quốc gia TP.HCM', short_name: 'VNUHCM', slug: 'vnuhcm', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Công nghệ Thông tin TP.HCM', short_name: 'UIT', slug: 'uit', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Y Dược TP.HCM', short_name: 'UMP', slug: 'ump', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Sư phạm TP.HCM', short_name: 'HCMUE', slug: 'hcmue', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Tôn Đức Thắng', short_name: 'TDTU', slug: 'tdtu', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Nguyễn Tất Thành', short_name: 'NTT', slug: 'ntt', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'private', scale: 'medium', status: 'published' },
    { name: 'Đại học Hoa Sen', short_name: 'HSU', slug: 'hsu', location_city: 'Hồ Chí Minh', location_region: 'South', type: 'private', scale: 'medium', status: 'published' },
    // Đà Nẵng
    { name: 'Đại học Đà Nẵng', short_name: 'UD', slug: 'ud', location_city: 'Đà Nẵng', location_region: 'Central', type: 'public', scale: 'large', status: 'published' },
    { name: 'Đại học Bách Khoa Đà Nẵng', short_name: 'DUT', slug: 'dut', location_city: 'Đà Nẵng', location_region: 'Central', type: 'public', scale: 'medium', status: 'published' },
    { name: 'Đại học Kinh tế Đà Nẵng', short_name: 'DUE', slug: 'due', location_city: 'Đà Nẵng', location_region: 'Central', type: 'public', scale: 'medium', status: 'published' },
    // Cần Thơ
    { name: 'Đại học Cần Thơ', short_name: 'CTU', slug: 'ctu', location_city: 'Cần Thơ', location_region: 'South', type: 'public', scale: 'large', status: 'published' },
    // Private/International
    { name: 'Đại học VinUni', short_name: 'VinUni', slug: 'vinuni', location_city: 'Hà Nội', location_region: 'North', type: 'private', scale: 'small', status: 'published' },
    { name: 'British University Vietnam', short_name: 'BUV', slug: 'buv', location_city: 'Hà Nội', location_region: 'North', type: 'international', scale: 'small', status: 'published' },
    { name: 'Đại học Phenikaa', short_name: 'Phenikaa', slug: 'phenikaa', location_city: 'Hà Nội', location_region: 'North', type: 'private', scale: 'medium', status: 'published' },
  ];

  const toInsert = universities.filter(u => !existingSlugs.has(u.slug));
  if (toInsert.length === 0) {
    console.log('  ℹ️  All universities already exist');
    return;
  }

  const result = await upsert('universities', toInsert, 'slug');
  console.log(`  ✅ Inserted ${result?.length || 0} new universities`);
}

// ============================================================
// 4. SEED Majors (50+ thêm)  
// ============================================================
async function seedMajors() {
  console.log('\n📌 Seeding more majors...');
  
  const existing = await select('majors', 'select=slug');
  const existingSlugs = new Set(existing?.map(m => m.slug) || []);

  const majors = [
    // Technology
    { name: 'Công nghệ thông tin', code: '7480201', slug: 'cong-nghe-thong-tin', field: 'Technology', status: 'published' },
    { name: 'An toàn thông tin', code: '7480202', slug: 'an-toan-thong-tin', field: 'Technology', status: 'published' },
    { name: 'Hệ thống thông tin', code: '7480104', slug: 'he-thong-thong-tin', field: 'Technology', status: 'published' },
    { name: 'Trí tuệ nhân tạo', code: '7480107', slug: 'tri-tue-nhan-tao', field: 'Technology', status: 'published' },
    { name: 'Khoa học dữ liệu', code: '7460108', slug: 'khoa-hoc-du-lieu', field: 'Technology', status: 'published' },
    { name: 'Kỹ thuật điện tử - viễn thông', code: '7520207', slug: 'ky-thuat-dien-tu-vien-thong', field: 'Engineering', status: 'published' },
    { name: 'Kỹ thuật điện', code: '7520201', slug: 'ky-thuat-dien', field: 'Engineering', status: 'published' },
    { name: 'Kỹ thuật cơ khí', code: '7520103', slug: 'ky-thuat-co-khi', field: 'Engineering', status: 'published' },
    { name: 'Kỹ thuật xây dựng', code: '7580201', slug: 'ky-thuat-xay-dung', field: 'Engineering', status: 'published' },
    { name: 'Kỹ thuật môi trường', code: '7520320', slug: 'ky-thuat-moi-truong', field: 'Engineering', status: 'published' },
    { name: 'Kỹ thuật hóa học', code: '7520301', slug: 'ky-thuat-hoa-hoc', field: 'Engineering', status: 'published' },
    { name: 'Công nghệ sinh học', code: '7420201', slug: 'cong-nghe-sinh-hoc', field: 'Science', status: 'published' },
    // Business
    { name: 'Tài chính - Ngân hàng', code: '7340201', slug: 'tai-chinh-ngan-hang', field: 'Business', status: 'published' },
    { name: 'Kế toán', code: '7340301', slug: 'ke-toan', field: 'Business', status: 'published' },
    { name: 'Kiểm toán', code: '7340302', slug: 'kiem-toan', field: 'Business', status: 'published' },
    { name: 'Thương mại điện tử', code: '7340122', slug: 'thuong-mai-dien-tu', field: 'Business', status: 'published' },
    { name: 'Logistics và Quản lý chuỗi cung ứng', code: '7510605', slug: 'logistics-chuoi-cung-ung', field: 'Business', status: 'published' },
    { name: 'Quản trị dịch vụ du lịch và lữ hành', code: '7810103', slug: 'quan-tri-du-lich-lu-hanh', field: 'Business', status: 'published' },
    { name: 'Quản trị khách sạn', code: '7810201', slug: 'quan-tri-khach-san', field: 'Business', status: 'published' },
    // Law & Social
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
    // Health
    { name: 'Y khoa', code: '7720101', slug: 'y-khoa', field: 'Health', status: 'published' },
    { name: 'Dược học', code: '7720201', slug: 'duoc-hoc', field: 'Health', status: 'published' },
    { name: 'Điều dưỡng', code: '7720301', slug: 'dieu-duong', field: 'Health', status: 'published' },
    { name: 'Răng - Hàm - Mặt', code: '7720501', slug: 'rang-ham-mat', field: 'Health', status: 'published' },
    // Design & Arts
    { name: 'Thiết kế đồ họa', code: '7210403', slug: 'thiet-ke-do-hoa', field: 'Design', status: 'published' },
    { name: 'Kiến trúc', code: '7580101', slug: 'kien-truc', field: 'Design', status: 'published' },
    { name: 'Thiết kế nội thất', code: '7580109', slug: 'thiet-ke-noi-that', field: 'Design', status: 'published' },
    { name: 'Mỹ thuật ứng dụng', code: '7210101', slug: 'my-thuat-ung-dung', field: 'Design', status: 'published' },
    // Education
    { name: 'Sư phạm Toán học', code: '7140209', slug: 'su-pham-toan-hoc', field: 'Education', status: 'published' },
    { name: 'Sư phạm Tiếng Anh', code: '7140231', slug: 'su-pham-tieng-anh', field: 'Education', status: 'published' },
    { name: 'Giáo dục Mầm non', code: '7140201', slug: 'giao-duc-mam-non', field: 'Education', status: 'published' },
    // Agriculture & Environment
    { name: 'Nông nghiệp', code: '7620101', slug: 'nong-nghiep', field: 'Agriculture', status: 'published' },
    { name: 'Thú y', code: '7640101', slug: 'thu-y', field: 'Agriculture', status: 'published' },
    { name: 'Khoa học môi trường', code: '7440301', slug: 'khoa-hoc-moi-truong', field: 'Science', status: 'published' },
    // Finance & Accounting additions
    { name: 'Bảo hiểm', code: '7340204', slug: 'bao-hiem', field: 'Business', status: 'published' },
  ];

  const toInsert = majors.filter(m => !existingSlugs.has(m.slug));
  if (toInsert.length === 0) {
    console.log('  ℹ️  All majors already exist');
    return;
  }

  for (let i = 0; i < toInsert.length; i += 20) {
    const batch = toInsert.slice(i, i + 20);
    const result = await upsert('majors', batch, 'slug');
    console.log(`  ✅ Inserted ${result?.length || 0} majors (batch ${Math.floor(i/20)+1})`);
  }
}

// ============================================================
// 5. Update careers with RIASEC profile data (CRITICAL for matching)
// ============================================================
async function seedCareersRiasecProfiles() {
  console.log('\n📌 Updating careers with RIASEC profiles...');
  
  // Get careers that don't have riasec_profile set
  const careers = await select('careers', 'select=id,code,career_domain_code&riasec_profile=is.null&status=eq.published&limit=504');
  
  if (!careers || careers.length === 0) {
    console.log('  ℹ️  All careers already have RIASEC profiles');
    return;
  }
  
  console.log(`  Found ${careers.length} careers without RIASEC profiles, updating...`);

  // Domain-based RIASEC profiles (based on established occupational psychology research)
  // Keys: R=Realistic, I=Investigative, A=Artistic, S=Social, E=Enterprising, C=Conventional
  const domainRiasecMap = {
    // Technology domains
    'TECH': { R: 0.3, I: 0.9, A: 0.2, S: 0.2, E: 0.3, C: 0.6 },
    'ENG': { R: 0.7, I: 0.8, A: 0.2, S: 0.2, E: 0.3, C: 0.5 },
    'SW': { R: 0.2, I: 0.9, A: 0.3, S: 0.2, E: 0.4, C: 0.7 },
    'DATA': { R: 0.2, I: 0.9, A: 0.2, S: 0.2, E: 0.3, C: 0.8 },
    // Business domains  
    'BIZ': { R: 0.1, I: 0.4, A: 0.2, S: 0.5, E: 0.9, C: 0.7 },
    'FIN': { R: 0.1, I: 0.7, A: 0.1, S: 0.3, E: 0.7, C: 0.9 },
    'MKT': { R: 0.1, I: 0.5, A: 0.6, S: 0.6, E: 0.9, C: 0.4 },
    'MGMT': { R: 0.2, I: 0.5, A: 0.2, S: 0.7, E: 0.9, C: 0.6 },
    // Health domains
    'MED': { R: 0.4, I: 0.8, A: 0.2, S: 0.9, E: 0.4, C: 0.6 },
    'NURSE': { R: 0.5, I: 0.5, A: 0.2, S: 0.9, E: 0.3, C: 0.5 },
    'PHARM': { R: 0.3, I: 0.8, A: 0.1, S: 0.6, E: 0.3, C: 0.8 },
    // Social/Education
    'EDU': { R: 0.2, I: 0.5, A: 0.5, S: 0.9, E: 0.4, C: 0.4 },
    'SOC': { R: 0.1, I: 0.4, A: 0.3, S: 0.9, E: 0.4, C: 0.3 },
    'LAW': { R: 0.1, I: 0.7, A: 0.3, S: 0.6, E: 0.8, C: 0.7 },
    // Creative/Design
    'ART': { R: 0.3, I: 0.4, A: 0.9, S: 0.5, E: 0.4, C: 0.2 },
    'DESIGN': { R: 0.3, I: 0.5, A: 0.9, S: 0.4, E: 0.5, C: 0.4 },
    'MEDIA': { R: 0.2, I: 0.4, A: 0.8, S: 0.6, E: 0.6, C: 0.3 },
    // Science/Research
    'SCI': { R: 0.3, I: 0.9, A: 0.3, S: 0.3, E: 0.3, C: 0.7 },
    'AGR': { R: 0.8, I: 0.6, A: 0.3, S: 0.4, E: 0.4, C: 0.5 },
    // Trade/Technical
    'TRADE': { R: 0.9, I: 0.4, A: 0.2, S: 0.3, E: 0.4, C: 0.5 },
    'TRANSPORT': { R: 0.7, I: 0.3, A: 0.1, S: 0.3, E: 0.4, C: 0.6 },
    // Default
    'DEFAULT': { R: 0.5, I: 0.5, A: 0.3, S: 0.5, E: 0.5, C: 0.5 },
  };

  const domainAbilityMap = {
    'TECH': { logical: 0.9, spatial: 0.5, verbal: 0.4, numerical: 0.8, creative: 0.5, interpersonal: 0.3 },
    'ENG': { logical: 0.9, spatial: 0.8, verbal: 0.4, numerical: 0.9, creative: 0.5, interpersonal: 0.3 },
    'SW': { logical: 0.9, spatial: 0.4, verbal: 0.5, numerical: 0.8, creative: 0.6, interpersonal: 0.4 },
    'BIZ': { logical: 0.7, spatial: 0.3, verbal: 0.8, numerical: 0.7, creative: 0.5, interpersonal: 0.8 },
    'FIN': { logical: 0.8, spatial: 0.2, verbal: 0.6, numerical: 0.9, creative: 0.3, interpersonal: 0.6 },
    'MKT': { logical: 0.6, spatial: 0.5, verbal: 0.9, numerical: 0.6, creative: 0.8, interpersonal: 0.8 },
    'MED': { logical: 0.8, spatial: 0.7, verbal: 0.7, numerical: 0.7, creative: 0.4, interpersonal: 0.9 },
    'EDU': { logical: 0.6, spatial: 0.4, verbal: 0.9, numerical: 0.5, creative: 0.6, interpersonal: 0.9 },
    'LAW': { logical: 0.9, spatial: 0.2, verbal: 0.9, numerical: 0.5, creative: 0.5, interpersonal: 0.8 },
    'ART': { logical: 0.4, spatial: 0.8, verbal: 0.6, numerical: 0.3, creative: 0.9, interpersonal: 0.6 },
    'DESIGN': { logical: 0.5, spatial: 0.9, verbal: 0.5, numerical: 0.4, creative: 0.9, interpersonal: 0.6 },
    'SCI': { logical: 0.9, spatial: 0.6, verbal: 0.6, numerical: 0.9, creative: 0.6, interpersonal: 0.4 },
    'DEFAULT': { logical: 0.5, spatial: 0.5, verbal: 0.5, numerical: 0.5, creative: 0.5, interpersonal: 0.5 },
  };

  // Map career_domain_code to RIASEC type
  function getDomainKey(domainCode) {
    if (!domainCode) return 'DEFAULT';
    const code = domainCode.toUpperCase();
    if (code.includes('TECH') || code.includes('IT') || code.includes('COMP')) return 'SW';
    if (code.includes('ENG') || code.includes('ENGINEER')) return 'ENG';
    if (code.includes('DATA') || code.includes('AI') || code.includes('ML')) return 'DATA';
    if (code.includes('FIN') || code.includes('BANK') || code.includes('ACC')) return 'FIN';
    if (code.includes('MKT') || code.includes('MARKET') || code.includes('SALE')) return 'MKT';
    if (code.includes('MGT') || code.includes('MGMT') || code.includes('BIZ')) return 'BIZ';
    if (code.includes('MED') || code.includes('HEALTH') || code.includes('DOC')) return 'MED';
    if (code.includes('NURSE') || code.includes('CARE')) return 'NURSE';
    if (code.includes('PHARM')) return 'PHARM';
    if (code.includes('EDU') || code.includes('TEACH') || code.includes('SCH')) return 'EDU';
    if (code.includes('SOC') || code.includes('COMM')) return 'SOC';
    if (code.includes('LAW') || code.includes('LEGAL')) return 'LAW';
    if (code.includes('ART') || code.includes('MUSIC') || code.includes('THEATRE')) return 'ART';
    if (code.includes('DESIGN') || code.includes('ARCH') || code.includes('GRAPH')) return 'DESIGN';
    if (code.includes('MEDIA') || code.includes('JOURNAL') || code.includes('COMM')) return 'MEDIA';
    if (code.includes('SCI') || code.includes('RESEARCH') || code.includes('LAB')) return 'SCI';
    if (code.includes('AGR') || code.includes('FARM') || code.includes('VET')) return 'AGR';
    if (code.includes('TRADE') || code.includes('CRAFT') || code.includes('REPAIR')) return 'TRADE';
    if (code.includes('TRANS') || code.includes('LOGIST') || code.includes('DRIVE')) return 'TRANSPORT';
    return 'DEFAULT';
  }

  // Update in batches of 50
  let updated = 0;
  for (let i = 0; i < Math.min(careers.length, 500); i += 50) {
    const batch = careers.slice(i, i + 50);
    
    for (const career of batch) {
      const domainKey = getDomainKey(career.career_domain_code);
      const riasecProfile = domainRiasecMap[domainKey] || domainRiasecMap['DEFAULT'];
      const abilityWeights = domainAbilityMap[domainKey] || domainAbilityMap['DEFAULT'];
      
      // Add small random variation (±0.1) to avoid all careers being identical
      const jitter = () => (Math.random() * 0.2) - 0.1;
      const profile = {};
      for (const [k, v] of Object.entries(riasecProfile)) {
        profile[k] = Math.max(0, Math.min(1, v + jitter()));
      }
      
      // Determine riasec_primary (highest value)
      const primary = Object.entries(profile).sort((a, b) => b[1] - a[1])[0][0];
      
      const res = await fetch(`${SUPABASE_URL}/rest/v1/careers?id=eq.${career.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          riasec_profile: profile,
          riasec_primary: primary,
          ability_weights: abilityWeights
        })
      });
      if (res.ok) updated++;
    }
    console.log(`  ✅ Updated ${updated}/${careers.length} careers with RIASEC profiles`);
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('='.repeat(60));
  console.log('1LEARN.ASIA — PRODUCTION SEED DATA');
  console.log('='.repeat(60));
  
  await seedAppSettings();
  await seedAssessmentData();
  await seedUniversities();
  await seedMajors();
  await seedCareersRiasecProfiles();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ SEED COMPLETE');
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
