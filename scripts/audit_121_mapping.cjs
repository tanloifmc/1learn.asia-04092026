require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Thiếu cấu hình Supabase trong .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log('🔍 BẮT ĐẦU AUDIT 121 CÂU HỎI TỪ DATABASE...');

  // 1. Fetch active version
  const { data: version, error: vErr } = await supabase
    .from('assessment_versions')
    .select('id, version_tag, config')
    .eq('status', 'published')
    .single();

  if (vErr || !version) {
    console.error('❌ Không tìm thấy published assessment_version.');
    process.exit(1);
  }
  console.log(`✅ Đang audit version: ${version.version_tag}`);

  // 2. Fetch questions with dimensions
  const { data: questions, error: qErr } = await supabase
    .from('assessment_questions')
    .select(`
      id,
      code,
      weight,
      is_reverse_scored,
      assessment_dimensions (
        id,
        code,
        framework,
        normalization_formula
      )
    `)
    .eq('version_id', version.id)
    .order('code', { ascending: true });

  if (qErr) {
    console.error('❌ Lỗi query questions:', qErr.message);
    process.exit(1);
  }

  console.log(`✅ Tìm thấy ${questions.length} câu hỏi.`);

  let tableData = [];
  let errorCount = 0;
  
  // Rules checking
  for (const q of questions) {
    let status = 'PASS';
    let issues = [];

    if (!q.assessment_dimensions) {
      status = 'FAIL';
      issues.push('Thiếu dimension mapping');
    } else {
      if (!q.assessment_dimensions.framework) issues.push('Thiếu framework');
      if (q.weight === null || q.weight === undefined) issues.push('Thiếu weight');
      if (q.is_reverse_scored === null || q.is_reverse_scored === undefined) issues.push('Thiếu is_reverse_scored flag');
    }

    if (issues.length > 0) {
      status = `FAIL (${issues.join(', ')})`;
      errorCount++;
    }

    tableData.push({
      question_code: q.code,
      framework: q.assessment_dimensions?.framework || 'N/A',
      dimension: q.assessment_dimensions?.code || 'N/A',
      weight: q.weight,
      reverse: q.is_reverse_scored,
      scoring_status: status
    });
  }

  // Generate markdown table
  let md = `# Audit 121-Question Mapping\n\n`;
  md += `**Version:** ${version.version_tag}\n`;
  md += `**Total Questions:** ${questions.length}\n`;
  md += `**Errors Found:** ${errorCount}\n\n`;
  md += `| Question Code | Framework | Dimension | Weight | Reverse | Scoring Status |\n`;
  md += `| --- | --- | --- | --- | --- | --- |\n`;
  tableData.forEach(r => {
    md += `| ${r.question_code} | ${r.framework} | ${r.dimension} | ${r.weight} | ${r.reverse} | ${r.scoring_status} |\n`;
  });

  const artifactPath = path.join('C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\d4591539-7dbc-4420-9bb0-e153d7287cb6', '121_mapping_audit.md');
  fs.writeFileSync(artifactPath, md);
  console.log(`\n✅ Audit hoàn tất. Đã lưu kết quả vào ${artifactPath}`);
}

runAudit();
