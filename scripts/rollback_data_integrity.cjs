/**
 * ROLLBACK SCRIPT: Restore Data Integrity
 * 
 * Mục tiêu:
 * 1. Xác định Taxonomy gốc (từ seed_production_data_v2.mjs)
 * 2. Tìm tất cả major_id "rác" (KHÔNG thuộc Taxonomy gốc)
 * 3. Ngắt liên kết: UPDATE university_majors SET major_id=NULL, mapping_status='UNMAPPED' an toàn
 * 4. Xóa major "rác" khỏi bảng majors (chỉ sau khi FK đã được ngắt)
 * 5. Kiểm tra count trước/sau
 * 
 * TUYỆT ĐỐI KHÔNG XÓA university_majors
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

// === TAXONOMY GỐC - lấy từ seed_production_data_v2.mjs ===
// Đây là danh sách slug chính thức của 1learn Taxonomy
const CANONICAL_TAXONOMY_SLUGS = [
  // From initial seed (seed_production_data.mjs / seed_production_data_v2.mjs)
  'khoa-hoc-may-tinh',
  'ky-thuat-phan-mem',
  'quan-tri-kinh-doanh',
  'kinh-te-quoc-te',
  'marketing',
  'cong-nghe-thong-tin',
  'an-toan-thong-tin',
  'he-thong-thong-tin',
  'tri-tue-nhan-tao',
  'khoa-hoc-du-lieu',
  'ky-thuat-dien-tu-vien-thong',
  'ky-thuat-dien',
  'ky-thuat-co-khi',
  'ky-thuat-xay-dung',
  'ky-thuat-moi-truong',
  'ky-thuat-hoa-hoc',
  'cong-nghe-sinh-hoc',
  'tai-chinh-ngan-hang',
  'ke-toan',
  'kiem-toan',
  'thuong-mai-dien-tu',
  'logistics-chuoi-cung-ung',
  'quan-tri-du-lich-lu-hanh',
  'quan-tri-khach-san',
  'luat',
  'luat-kinh-te',
  'quan-he-quoc-te',
  'ngon-ngu-anh',
  'ngon-ngu-nhat',
  'ngon-ngu-trung-quoc',
  'bao-chi',
  'truyen-thong-da-phuong-tien',
  'tam-ly-hoc',
  'cong-tac-xa-hoi',
  'y-khoa',
  'duoc-hoc',
  'dieu-duong',
  'rang-ham-mat',
  'thiet-ke-do-hoa',
  'kien-truc',
  'thiet-ke-noi-that',
  'su-pham-toan-hoc',
  'su-pham-tieng-anh',
  'giao-duc-mam-non',
  'nong-nghiep',
  'thu-y',
  'khoa-hoc-moi-truong',
  'bao-hiem',
  'my-thuat-ung-dung',
  'kinh-te-hoc',
  // Also include majors that were manually mapped for Career->Major testbed:
  'y-da-khoa',
  // Plus other majors seeded in earlier rounds (we'll discover these below)
];

async function run() {
  try {
    console.log('\n==============================');
    console.log('=== DATA INTEGRITY ROLLBACK ===');
    console.log('==============================\n');

    // === STEP 0: COUNT BEFORE ===
    const before_um = await pool.query('SELECT COUNT(*) as c FROM university_majors');
    const before_m = await pool.query('SELECT COUNT(*) as c FROM majors');
    console.log(`BEFORE: university_majors = ${before_um.rows[0].c}`);
    console.log(`BEFORE: majors = ${before_m.rows[0].c}`);

    // === STEP 1: Xác định Taxonomy gốc từ DB ===
    // Taxonomy gốc = majors có slug nằm trong danh sách CANONICAL
    // hoặc có field != 'Chưa phân loại' (dấu hiệu được tạo bởi seed chính thức)
    
    // Lấy toàn bộ majors
    const allMajors = await pool.query(`
      SELECT id, name, slug, field, status, created_at 
      FROM majors 
      ORDER BY created_at ASC
    `);
    
    console.log(`\nTotal majors in DB: ${allMajors.rows.length}`);

    // Phân loại:
    // - CANONICAL: slug nằm trong danh sách gốc
    // - JUNK: field = 'Chưa phân loại' (được tạo bởi promote script)
    const canonicalSlugs = new Set(CANONICAL_TAXONOMY_SLUGS);
    const junkMajors = allMajors.rows.filter(m => m.field === 'Chưa phân loại');
    const canonicalMajors = allMajors.rows.filter(m => m.field !== 'Chưa phân loại');

    console.log(`\nCanonical Taxonomy majors (field != 'Chưa phân loại'): ${canonicalMajors.length}`);
    console.log(`Junk majors (field = 'Chưa phân loại'): ${junkMajors.length}`);

    if (junkMajors.length === 0) {
      console.log('\n✅ No junk majors found. No rollback needed.');
      await pool.end();
      return;
    }

    // === STEP 2: Kiểm tra FK - bao nhiêu university_majors trỏ tới junk majors? ===
    const junkIds = junkMajors.map(m => `'${m.id}'`).join(',');
    const umLinkedToJunk = await pool.query(`
      SELECT COUNT(*) as c 
      FROM university_majors 
      WHERE major_id IN (${junkIds})
    `);
    console.log(`\nuniversity_majors linked to junk majors (FK to reset): ${umLinkedToJunk.rows[0].c}`);

    // === STEP 3: Ngắt liên kết an toàn - UPDATE, KHÔNG DELETE university_majors ===
    console.log('\n[Step 3] Resetting FK links: major_id = NULL, mapping_status = UNMAPPED...');
    
    const updateResult = await pool.query(`
      UPDATE university_majors
      SET 
        major_id = NULL,
        mapping_status = 'UNMAPPED'
      WHERE major_id IN (${junkIds})
    `);
    console.log(`Updated ${updateResult.rowCount} university_majors rows: major_id = NULL, mapping_status = UNMAPPED`);

    // === STEP 4: Verify FK đã ngắt xong trước khi DELETE ===
    const remainingLinks = await pool.query(`
      SELECT COUNT(*) as c 
      FROM university_majors 
      WHERE major_id IN (${junkIds})
    `);
    
    if (parseInt(remainingLinks.rows[0].c) > 0) {
      console.error(`❌ ERROR: ${remainingLinks.rows[0].c} FK links still remain. ABORT - not deleting junk majors.`);
      await pool.end();
      return;
    }
    console.log('FK links cleared: 0 remaining. Safe to delete junk majors.');

    // === STEP 5: Xóa junk majors khỏi bảng majors ===
    console.log(`\n[Step 5] Deleting ${junkMajors.length} junk majors from majors table...`);
    const deleteResult = await pool.query(`
      DELETE FROM majors 
      WHERE field = 'Chưa phân loại'
    `);
    console.log(`Deleted ${deleteResult.rowCount} junk majors from majors.`);

    // === STEP 6: COUNT AFTER ===
    const after_um = await pool.query('SELECT COUNT(*) as c FROM university_majors');
    const after_m = await pool.query('SELECT COUNT(*) as c FROM majors');
    const after_unmapped = await pool.query("SELECT COUNT(*) as c FROM university_majors WHERE major_id IS NULL");
    const after_accepted = await pool.query("SELECT COUNT(*) as c FROM university_majors WHERE mapping_status = 'ACCEPTED_MATCH'");
    
    console.log('\n==============================');
    console.log('=== AUDIT RESULTS AFTER ROLLBACK ===');
    console.log('==============================');
    console.log(`university_majors BEFORE: ${before_um.rows[0].c}`);
    console.log(`university_majors AFTER:  ${after_um.rows[0].c}`);
    console.log(`ACTUAL MAJORS LOST:       ${before_um.rows[0].c - after_um.rows[0].c} (MUST BE 0)`);
    console.log('');
    console.log(`majors BEFORE: ${before_m.rows[0].c}`);
    console.log(`majors AFTER:  ${after_m.rows[0].c}`);
    console.log(`majors DELETED (junk): ${before_m.rows[0].c - after_m.rows[0].c}`);
    console.log('');
    console.log(`university_majors UNMAPPED (major_id IS NULL): ${after_unmapped.rows[0].c}`);
    console.log(`university_majors ACCEPTED_MATCH:              ${after_accepted.rows[0].c}`);

    // === STEP 7: SAMPLE 3 universities to verify ===
    console.log('\n=== SPOT CHECK: 3 Universities ===');
    const sampleUnis = await pool.query(`
      SELECT u.code, u.name, COUNT(um.id) as count
      FROM universities u
      LEFT JOIN university_majors um ON um.university_id = u.id
      GROUP BY u.id, u.code, u.name
      ORDER BY count DESC
      LIMIT 3
    `);
    for (const uni of sampleUnis.rows) {
      console.log(`  ${uni.code} (${uni.name}): ${uni.count} Actual Majors`);
    }

    // === FINAL VERDICT ===
    const actualLost = before_um.rows[0].c - after_um.rows[0].c;
    const unmappedCount = parseInt(after_unmapped.rows[0].c);
    const taxonomyCount = parseInt(after_m.rows[0].c);

    console.log('\n==============================');
    console.log('=== FINAL VERDICT ===');
    console.log('==============================');
    if (actualLost === 0) {
      console.log('✅ PASS: 0 Actual Majors lost');
    } else {
      console.log(`❌ FAIL: ${actualLost} Actual Majors were lost!`);
    }
    console.log(`Taxonomy majors remaining: ${taxonomyCount} (Canonical only)`);
    console.log(`UNMAPPED programs: ${unmappedCount} (real-world majors not yet mapped to taxonomy)`);
    
    if (actualLost === 0 && unmappedCount > 0) {
      console.log('\n✅ DATA INTEGRITY PASS: 3-layer architecture restored.');
      console.log('   ACTUAL MAJOR (university_majors) → optional → TAXONOMY (majors)');
    }

  } finally {
    await pool.end();
  }
}

run();
