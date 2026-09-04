/**
 * Fix: Reload schema cache + insert Big Five/Work Values dimensions + update career RIASEC profiles
 * riasec_primary is a GENERATED column, so we can only update riasec_profile
 */

const BASE = 'https://cbhkrijxgqedcxywuwut.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const MGMT = process.env.SUPABASE_MGMT_TOKEN || '';
const PROJ = 'cbhkrijxgqedcxywuwut';

const H = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

async function get(table, params = '') {
  const r = await fetch(`${BASE}/rest/v1/${table}?${params}`, { headers: H });
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
    console.error(`❌ INSERT ${table}:`, JSON.stringify(d));
    return [];
  }
  return d;
}

async function runSql(sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJ}/database/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MGMT}` },
    body: JSON.stringify({ query: sql })
  });
  return { ok: r.ok, status: r.status, data: await r.json() };
}

// Step 1: Check riasec_primary - is it actually a generated column?
console.log('Step 1: Checking riasec_primary column definition...');
const colCheck = await runSql(`
  SELECT column_name, is_generated, generation_expression, data_type
  FROM information_schema.columns 
  WHERE table_name = 'careers' AND column_name IN ('riasec_primary', 'riasec_profile', 'ability_weights');
`);
console.log('Column info:', JSON.stringify(colCheck.data));

// Step 2: Update only riasec_profile (generated column handles primary automatically)
console.log('\nStep 2: Updating careers riasec_profile (riasec_primary auto-computed)...');
const updateRiasec = await runSql(`
  UPDATE public.careers
  SET 
    riasec_profile = CASE
      WHEN career_domain_code ILIKE '%tech%' OR career_domain_code ILIKE '%it%' OR career_domain_code ILIKE '%software%'
        THEN '{"R": 0.25, "I": 0.88, "A": 0.30, "S": 0.20, "E": 0.38, "C": 0.65}'::jsonb
      WHEN career_domain_code ILIKE '%eng%'
        THEN '{"R": 0.72, "I": 0.80, "A": 0.22, "S": 0.22, "E": 0.30, "C": 0.55}'::jsonb
      WHEN career_domain_code ILIKE '%fin%' OR career_domain_code ILIKE '%acc%' OR career_domain_code ILIKE '%bank%'
        THEN '{"R": 0.12, "I": 0.68, "A": 0.12, "S": 0.32, "E": 0.72, "C": 0.88}'::jsonb
      WHEN career_domain_code ILIKE '%mkt%' OR career_domain_code ILIKE '%market%' OR career_domain_code ILIKE '%sale%'
        THEN '{"R": 0.12, "I": 0.48, "A": 0.62, "S": 0.60, "E": 0.88, "C": 0.40}'::jsonb
      WHEN career_domain_code ILIKE '%mgmt%' OR career_domain_code ILIKE '%biz%'
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
      WHEN career_domain_code ILIKE '%agr%' OR career_domain_code ILIKE '%farm%' OR career_domain_code ILIKE '%agri%'
        THEN '{"R": 0.80, "I": 0.60, "A": 0.30, "S": 0.42, "E": 0.40, "C": 0.52}'::jsonb
      WHEN career_domain_code ILIKE '%soc%' OR career_domain_code ILIKE '%social%' OR career_domain_code ILIKE '%comm%'
        THEN '{"R": 0.12, "I": 0.42, "A": 0.32, "S": 0.90, "E": 0.42, "C": 0.32}'::jsonb
      WHEN career_domain_code ILIKE '%construct%' OR career_domain_code ILIKE '%build%'
        THEN '{"R": 0.85, "I": 0.45, "A": 0.25, "S": 0.30, "E": 0.40, "C": 0.55}'::jsonb
      WHEN career_domain_code ILIKE '%trade%' OR career_domain_code ILIKE '%craft%'
        THEN '{"R": 0.88, "I": 0.35, "A": 0.25, "S": 0.35, "E": 0.40, "C": 0.50}'::jsonb
      WHEN career_domain_code ILIKE '%transport%' OR career_domain_code ILIKE '%logist%'
        THEN '{"R": 0.65, "I": 0.38, "A": 0.15, "S": 0.38, "E": 0.45, "C": 0.62}'::jsonb
      ELSE '{"R": 0.45, "I": 0.55, "A": 0.35, "S": 0.50, "E": 0.52, "C": 0.52}'::jsonb
    END,
    ability_weights = CASE
      WHEN career_domain_code ILIKE '%tech%' OR career_domain_code ILIKE '%it%' OR career_domain_code ILIKE '%software%'
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
  WHERE riasec_profile IS NULL AND status = 'published';
`);
console.log('RIASEC update result:', updateRiasec.status, JSON.stringify(updateRiasec.data)?.slice(0, 200));

// Step 3: Check how many careers now have riasec_profile set
const withRiasec = await runSql(`SELECT COUNT(*) FROM careers WHERE riasec_profile IS NOT NULL;`);
const withoutRiasec = await runSql(`SELECT COUNT(*) FROM careers WHERE riasec_profile IS NULL;`);
console.log('\nCareers WITH riasec_profile:', JSON.stringify(withRiasec.data));
console.log('Careers WITHOUT riasec_profile:', JSON.stringify(withoutRiasec.data));

// Step 4: Fix assessment dimensions - insert without 'framework' field (use SQL directly)
console.log('\nStep 4: Inserting Big Five + Work Values dimensions via SQL...');
const versions = await get('assessment_versions', 'select=id');
const versionId = versions[0]?.id;

if (versionId) {
  const insertDimsSql = `
    INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework)
    VALUES 
      ('${versionId}', 'O', 'Cởi mở (Openness)', 'Khả năng sáng tạo và cởi mở với trải nghiệm mới', 'big_five'),
      ('${versionId}', 'C_BF', 'Cẩn thận (Conscientiousness)', 'Sự có trách nhiệm, có kế hoạch và kiên trì', 'big_five'),
      ('${versionId}', 'EX', 'Hướng ngoại (Extraversion)', 'Năng lượng xã hội và sự quyết đoán', 'big_five'),
      ('${versionId}', 'AG', 'Hòa đồng (Agreeableness)', 'Sự hợp tác và tin tưởng người khác', 'big_five'),
      ('${versionId}', 'EM', 'Ổn định cảm xúc (Emotional Stability)', 'Xu hướng ổn định cảm xúc', 'big_five'),
      ('${versionId}', 'WV_ACHIEVE', 'Thành tích', 'Coi trọng việc đạt được mục tiêu và kết quả', 'work_values'),
      ('${versionId}', 'WV_SOCIAL', 'Đóng góp xã hội', 'Coi trọng việc giúp đỡ và tác động đến cộng đồng', 'work_values'),
      ('${versionId}', 'WV_AUTONOMY', 'Tự chủ', 'Coi trọng sự độc lập và tự quyết định', 'work_values'),
      ('${versionId}', 'WV_SECURITY', 'An toàn', 'Coi trọng sự ổn định và an toàn trong công việc', 'work_values'),
      ('${versionId}', 'WV_CREATIVE', 'Sáng tạo', 'Coi trọng khả năng sáng tạo và đổi mới', 'work_values')
    ON CONFLICT (version_id, code) DO NOTHING
    RETURNING id, code;
  `;
  const dimResult = await runSql(insertDimsSql);
  console.log('Dimensions inserted:', JSON.stringify(dimResult.data));

  // Step 5: Now insert questions via SQL for the new dimensions
  const allDims = await runSql(`SELECT id, code FROM assessment_dimensions WHERE version_id = '${versionId}'`);
  const dimMap = {};
  if (Array.isArray(allDims.data)) {
    allDims.data.forEach(d => { dimMap[d.code] = d.id; });
  }
  console.log('Dimension map:', Object.keys(dimMap).join(', '));
  
  const questions = [];
  let idx = 50;
  
  const bigFiveQs = {
    'O': ['Tôi thích thử nghiệm những cách tiếp cận mới và sáng tạo để giải quyết vấn đề.', 'Tôi thường xuyên khám phá các chủ đề hoặc lĩnh vực mà tôi chưa quen thuộc.', 'Tôi có trí tưởng tượng phong phú và thích đặt ra những ý tưởng độc đáo.', 'Tôi thích làm mọi thứ theo một cách cố định và không thích thay đổi.', 'Nghệ thuật, âm nhạc hoặc văn chương thường thu hút sự chú ý của tôi.'],
    'C_BF': ['Tôi thường hoàn thành nhiệm vụ đúng hạn mà không để công việc tồn đọng.', 'Tôi lên kế hoạch tỉ mỉ trước khi bắt đầu một dự án quan trọng.', 'Tôi rất chú ý đến từng chi tiết nhỏ trong công việc của mình.', 'Tôi thường để đồ đạc lộn xộn và khó tìm thấy thứ cần dùng.', 'Tôi kiên trì theo đuổi mục tiêu dù gặp nhiều khó khăn.'],
    'EX': ['Tôi cảm thấy tràn đầy năng lượng khi gặp gỡ và trò chuyện với nhiều người.', 'Tôi thích chủ động bắt chuyện với người mới quen.', 'Tôi thích các sự kiện xã hội và không khí náo nhiệt hơn là ở nhà một mình.', 'Sau những buổi gặp gỡ đông người, tôi cảm thấy mệt mỏi và cần thời gian một mình.', 'Tôi dễ dàng thể hiện ý kiến và cảm xúc trước đám đông.'],
    'AG': ['Tôi luôn cố gắng hiểu quan điểm của người khác trước khi đưa ra ý kiến.', 'Tôi sẵn lòng thỏa hiệp để duy trì mối quan hệ hòa hảo với mọi người.', 'Tôi thường cảm thấy đồng cảm với những người đang gặp khó khăn.', 'Tôi không ngại tranh luận kịch liệt để bảo vệ quan điểm của mình.', 'Tôi thường tin tưởng rằng hầu hết mọi người có ý định tốt.'],
    'EM': ['Tôi thường giữ được bình tĩnh ngay cả trong những tình huống căng thẳng.', 'Tôi ít lo lắng về những điều chưa chắc xảy ra.', 'Tôi cảm thấy ổn định về mặt cảm xúc qua hầu hết các tình huống.', 'Tôi dễ bị căng thẳng và lo âu khi đối mặt với áp lực.', 'Tôi hiếm khi cảm thấy buồn bã hay chán nản mà không rõ lý do.'],
  };
  const wvQs = {
    'WV_ACHIEVE': ['Việc đặt ra mục tiêu cao và đạt được chúng là điều quan trọng nhất với tôi trong công việc.', 'Tôi muốn làm việc ở nơi thành tích cá nhân được đánh giá cao và công nhận.', 'Tôi cảm thấy thỏa mãn khi được giao thêm trách nhiệm và thử thách mới.', 'Tôi thích môi trường cạnh tranh nơi tôi có thể chứng minh năng lực bản thân.'],
    'WV_SOCIAL': ['Điều tôi muốn nhất từ công việc là được đóng góp tích cực cho xã hội.', 'Tôi muốn công việc của mình trực tiếp giúp đỡ hoặc cải thiện cuộc sống của người khác.', 'Làm việc cho tổ chức có ý nghĩa xã hội quan trọng hơn với tôi so với mức lương cao.', 'Tôi sẽ cảm thấy trống rỗng nếu công việc không tạo ra giá trị gì cho cộng đồng.'],
    'WV_AUTONOMY': ['Tôi muốn có quyền tự quyết định cách thức và thời điểm hoàn thành công việc của mình.', 'Tôi không thích bị giám sát chặt chẽ hay phải báo cáo thường xuyên.', 'Lịch làm việc linh hoạt quan trọng hơn với tôi so với thu nhập ổn định.', 'Tôi muốn làm việc độc lập hơn là phải phối hợp nhịp nhàng với nhiều người.'],
    'WV_SECURITY': ['Một công việc ổn định với thu nhập đảm bảo quan trọng hơn công việc hấp dẫn nhưng rủi ro cao.', 'Tôi muốn có lộ trình thăng tiến rõ ràng và dự đoán được trong sự nghiệp.', 'Tôi ưu tiên làm việc tại các công ty lớn, ổn định hơn là startup rủi ro.', 'Mức thu nhập ổn định qua nhiều năm quan trọng hơn cơ hội kiếm nhiều tiền nhưng bấp bênh.'],
    'WV_CREATIVE': ['Công việc phải cho phép tôi thể hiện sự sáng tạo và phong cách cá nhân.', 'Tôi muốn làm việc ở nơi các ý tưởng mới được khuyến khích và thử nghiệm.', 'Tôi cảm thấy nhàm chán với công việc lặp đi lặp lại và thiếu sự đổi mới.', 'Việc tạo ra sản phẩm hoặc giải pháp hoàn toàn mới là điều tôi theo đuổi.'],
  };
  const reverseIndexes = { 'O': [3], 'C_BF': [3], 'EX': [3], 'AG': [3], 'EM': [3] };
  
  for (const [code, qs] of Object.entries({ ...bigFiveQs, ...wvQs })) {
    const dimId = dimMap[code];
    if (!dimId) { console.log(`⚠️ No dim for ${code}`); continue; }
    const reverses = reverseIndexes[code] || [];
    for (let i = 0; i < qs.length; i++) {
      questions.push(`('${versionId}', '${dimId}', ${idx++}, '${qs[i].replace(/'/g, "''")}', ${reverses.includes(i)}, 1.0)`);
    }
  }
  
  if (questions.length > 0) {
    const insertQSql = `
      INSERT INTO assessment_questions (version_id, dimension_id, order_index, question_text, is_reverse_scored, weight)
      VALUES ${questions.join(',\n')}
      RETURNING id, order_index;
    `;
    const qResult = await runSql(insertQSql);
    console.log(`Inserted ${Array.isArray(qResult.data) ? qResult.data.length : 0} questions:`, qResult.status);
    
    // Now add options for each question
    if (Array.isArray(qResult.data) && qResult.data.length > 0) {
      const optionRows = [];
      for (const q of qResult.data) {
        optionRows.push(`('${q.id}', 'Hoàn toàn không đồng ý', 1, 1)`);
        optionRows.push(`('${q.id}', 'Không đồng ý', 2, 2)`);
        optionRows.push(`('${q.id}', 'Trung lập', 3, 3)`);
        optionRows.push(`('${q.id}', 'Đồng ý', 4, 4)`);
        optionRows.push(`('${q.id}', 'Hoàn toàn đồng ý', 5, 5)`);
      }
      
      for (let i = 0; i < optionRows.length; i += 200) {
        const batch = optionRows.slice(i, i + 200);
        const optSql = `
          INSERT INTO assessment_question_options (question_id, option_text, option_value, order_index)
          VALUES ${batch.join(',\n')};
        `;
        const optResult = await runSql(optSql);
        console.log(`Options batch ${Math.floor(i/200)+1}:`, optResult.status);
      }
    }
  }
}

// Final counts
const totalQ = await runSql(`SELECT COUNT(*) FROM assessment_questions`);
const careersWithRiasec = await runSql(`SELECT COUNT(*) FROM careers WHERE riasec_profile IS NOT NULL`);
console.log('\n📊 FINAL COUNTS:');
console.log('Assessment questions:', JSON.stringify(totalQ.data));
console.log('Careers with RIASEC:', JSON.stringify(careersWithRiasec.data));
