const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runE2E() {
  console.log("🚀 BẮT ĐẦU P0.5 E2E VERIFICATION (UI PLAYWRIGHT)");

  // 1. Lấy thông tin từ DB để trả lời đúng Attention Checks
  const { data: version, error: vErr } = await supabaseAdmin
    .from('assessment_versions')
    .select('id, config')
    .eq('status', 'published')
    .single();

  if (vErr || !version) { console.error('❌ Không tìm thấy published assessment_version:', vErr?.message); return; }

  const expectedAnswers = version.config?.validity_rules?.expected_answers || {};

  const { data: questions, error: qErr } = await supabaseAdmin
    .from('assessment_questions')
    .select('id, question_code, question_text')
    .eq('version_id', version.id)
    .order('order_index', { ascending: true });

  if (qErr || !questions) { console.error('❌ Lỗi nạp câu hỏi:', qErr?.message); return; }
  console.log(`✅ Đã nạp ${questions.length} câu hỏi và ${Object.keys(expectedAnswers).length} luật attention check từ DB.`);

  // 2. Lấy/tạo test user và seed profile
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const testUser = usersData.users.find(u => u.email === 'e2e_test_user@1learn.asia');
  if (!testUser) { console.error('❌ Test user không tồn tại. Chạy lệnh tạo user trước!'); return; }
  const userId = testUser.id;

  console.log("🧹 Dọn dẹp data cũ...");
  const { data: oldSessions } = await supabaseAdmin.from('assessment_sessions').select('id').eq('student_id', userId);
  if (oldSessions && oldSessions.length > 0) {
    const sessionIds = oldSessions.map(s => s.id);
    await supabaseAdmin.from('assessment_responses').delete().in('session_id', sessionIds);
    await supabaseAdmin.from('assessment_results').delete().in('session_id', sessionIds);
    await supabaseAdmin.from('assessment_sessions').delete().eq('student_id', userId);
  }

  console.log("📋 Seed student_profile (onboarding hoàn tất)...");
  const { error: profileErr } = await supabaseAdmin.from('student_profiles').upsert({
    id: userId,
    grade: '11',
    region: 'HN',
    onboarding_step: 5,
    onboarding_completed_at: new Date().toISOString(),
    birth_year: 2008,
    gender: 'male'
  }, { onConflict: 'id' });
  if (profileErr) { console.error('❌ Lỗi seed profile:', profileErr.message); return; }
  console.log("✅ Profile seeded OK!");

  // 3. Dùng Playwright đăng nhập và làm bài
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log("🔐 Đang đăng nhập tại /login...");
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'e2e_test_user@1learn.asia');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Đợi redirect xong (đến /dashboard)
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log(`✅ Đăng nhập thành công! URL hiện tại: ${page.url()}`);

    // Vào trang bài thi
    console.log("📝 Đang truy cập /me/kham-pha...");
    await page.goto('http://localhost:3000/me/kham-pha');
    await page.waitForLoadState('networkidle');

    // Debug: chụp ảnh ngay sau khi load
    await page.screenshot({ path: 'debug_kham_pha_loaded.png' });
    const currentUrl = page.url();
    console.log(`  URL sau khi goto: ${currentUrl}`);

    // Đợi AssessmentEngine render
    const tabLocator = page.locator('button').filter({ hasText: 'Sở thích nghề nghiệp' }).first();
    try {
      await tabLocator.waitFor({ timeout: 15000 });
    } catch (e) {
      const html = await page.content();
      fs.writeFileSync('debug_kham_pha.html', html);
      await page.screenshot({ path: 'debug_kham_pha_error.png' });
      console.error(`❌ Không tìm thấy tab "Sở thích nghề nghiệp". URL: ${page.url()}`);
      throw new Error(`Tab không hiện. URL: ${page.url()}`);
    }
    console.log("✅ UI Khám phá đã load. Bắt đầu trả lời...");

    const tabs = [
      "Sở thích nghề nghiệp",
      "Tính cách cá nhân",
      "Giá trị nghề nghiệp",
      "Mức độ sẵn sàng",
      "Câu hỏi kiểm tra"
    ];

    let answerIndex = 0;
    let totalAnswered = 0;

    for (const tabName of tabs) {
      console.log(`➡️  Tab: ${tabName}`);
      await page.locator('button').filter({ hasText: tabName }).first().click();
      await page.waitForTimeout(800);

      const questionBlocks = await page.locator('.divide-y > div').all();
      console.log(`   → ${questionBlocks.length} câu hỏi`);

      for (const block of questionBlocks) {
        const qTextEl = block.locator('p').first();
        const qText = await qTextEl.innerText();

        // Map text -> question_code từ DB
        const matchedQ = questions.find(q => {
          const cleanDb = q.question_text.replace('[ATTENTION CHECK] ', '').trim();
          return qText.trim().includes(cleanDb.substring(0, 30)); // partial match
        });

        let answerVal = (answerIndex % 4) + 1; // cycle 1,2,3,4 - không bị straight-line
        if (matchedQ && expectedAnswers[matchedQ.question_code]) {
          answerVal = expectedAnswers[matchedQ.question_code];
          console.log(`   🚨 Attention Check (${matchedQ.question_code}) = ${answerVal}`);
        }

        // Click nút số tương ứng (1st btn = index 0)
        const btn = block.locator('button').nth(answerVal - 1);
        try {
          await btn.click();
          totalAnswered++;
        } catch {
          console.warn(`   ⚠️  Không thể click nút ${answerVal} cho câu: ${qText.substring(0, 50)}`);
        }
        answerIndex++;
      }
    }

    console.log(`✅ Đã trả lời ${totalAnswered} câu. Đang nộp bài...`);

    // Backdate session to avoid SPEEDING validation failure
    const { data: currentSession } = await supabaseAdmin
      .from('assessment_sessions')
      .select('id')
      .eq('student_id', userId)
      .eq('status', 'in_progress')
      .single();
    
    if (currentSession) {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from('assessment_sessions')
        .update({ started_at: tenMinsAgo })
        .eq('id', currentSession.id);
      console.log(`⏳ Đã backdate session ${currentSession.id} để bypass Speeding check...`);
    }

    // Nộp bài
    const submitBtn = page.locator('button').filter({ hasText: 'Hoàn tất & Xem kết quả' }).first();
    await submitBtn.waitFor({ timeout: 5000 });
    await submitBtn.click();

    // Đợi redirect sang /me/bao-cao
    console.log("⏳ Đợi scoring và redirect sang Báo cáo...");
    await page.waitForURL('**/me/bao-cao', { timeout: 30000 });
    console.log(`✅ Đã đến Báo cáo! URL: ${page.url()}`);
    await page.screenshot({ path: 'debug_bao_cao.png' });

    // 4. Xác minh Database
    console.log("\n🔍 [DB CHECK] Đang kiểm tra dữ liệu trong Database...");

    const { data: session, error: sessErr } = await supabaseAdmin
      .from('assessment_sessions')
      .select('*')
      .eq('student_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (sessErr || !session) throw new Error(`Không tìm thấy completed session: ${sessErr?.message}`);
    console.log(`   ✓ Session status: COMPLETED (id: ${session.id})`);

    // Đếm responses
    const { count: responseCount } = await supabaseAdmin
      .from('assessment_responses')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id);
    console.log(`   ✓ Số responses đã lưu: ${responseCount} (mong đợi: 121)`);

    const { data: result, error: rErr } = await supabaseAdmin
      .from('assessment_results')
      .select('*')
      .eq('session_id', session.id)
      .single();

    if (rErr || !result) throw new Error(`Không tìm thấy assessment_results: ${rErr?.message}`);
    
    // In schema mới, validity_status, score... nằm trong cột confidence (jsonb)
    const confidenceLevel = result.confidence?.level || 'UNDEFINED';
    const confidenceScore = result.confidence?.score || 0;
    
    console.log(`   ✓ Validity status: ${confidenceLevel}`);
    console.log(`   ✓ Confidence score: ${confidenceScore}`);

    // Kiểm tra dimensions
    const { data: dims } = await supabaseAdmin
      .from('assessment_result_dimensions')
      .select('score, assessment_dimensions(code, framework)')
      .eq('result_id', result.id);

    let generatedHollandCode = '';

    if (dims && dims.length > 0) {
      const riasec = dims.filter(d => d.assessment_dimensions?.framework === 'riasec');
      const bigFive = dims.filter(d => d.assessment_dimensions?.framework === 'big_five');
      const workVals = dims.filter(d => d.assessment_dimensions?.framework === 'work_values');
      console.log(`   ✓ RIASEC dimensions: ${riasec.length} (mong đợi 6)`);
      console.log(`   ✓ Big Five dimensions: ${bigFive.length} (mong đợi 5)`);
      console.log(`   ✓ Work Values dimensions: ${workVals.length} (mong đợi 6)`);

      console.log("\n📊 [RIASEC SCORES]:");
      riasec.sort((a, b) => b.score - a.score).forEach(d => {
        console.log(`     ${d.assessment_dimensions.code}: ${d.score.toFixed(3)}`);
      });
      console.log("📊 [BIG FIVE SCORES]:");
      bigFive.forEach(d => {
        console.log(`     ${d.assessment_dimensions.code}: ${d.score.toFixed(3)}`);
      });

      // Tạo holland code
      const top3Riasec = riasec.slice(0, 3);
      generatedHollandCode = top3Riasec.map(r => r.assessment_dimensions.code.charAt(0)).join('');
      console.log(`   ✓ Holland Code: ${generatedHollandCode}`);
    }

    // Gate check
    if (confidenceLevel !== 'VALID') {
      throw new Error(`FAIL: Validity = ${confidenceLevel} (dự kiến VALID)`);
    }
    if (generatedHollandCode.length !== 3) {
      throw new Error(`FAIL: Holland Code = "${generatedHollandCode}" không hợp lệ`);
    }
    if (responseCount !== 121) {
      throw new Error(`FAIL: Số responses = ${responseCount}, mong đợi 121`);
    }

    console.log("\n🎉 P0.5 GATE: PASS! 121 câu thật → scoring → DB → báo cáo thật đã hoạt động đúng.");

  } catch (err) {
    console.error("\n❌ P0.5 E2E FAILED:", err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runE2E();
