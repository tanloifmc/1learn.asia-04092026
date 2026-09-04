require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function rollback() {
  try {
    // 1. SELECT to confirm 502 rows
    const beforeCheck = await pool.query("SELECT count(*) FROM career_major_mappings WHERE created_at >= '2026-08-31T08:40:00Z'");
    const rowsToDelete = parseInt(beforeCheck.rows[0].count, 10);
    console.log(`1. Đã xác nhận: ${rowsToDelete} rows`);

    if (rowsToDelete !== 502) {
      throw new Error(`Expected exactly 502 rows, found ${rowsToDelete}. Aborting delete.`);
    }

    // 2. DELETE the 502 rows
    const deleteResult = await pool.query("DELETE FROM career_major_mappings WHERE created_at >= '2026-08-31T08:40:00Z'");
    console.log(`2. Đã xóa: ${deleteResult.rowCount} rows`);

    // 3. SELECT count to verify remaining
    const afterCheck = await pool.query("SELECT count(*) FROM career_major_mappings");
    console.log(`3. Tổng career_major_mappings còn lại: ${afterCheck.rows[0].count} rows`);
    console.log("4. Lỗi: Không có lỗi.");

  } catch (err) {
    console.error("4. Có lỗi xảy ra:", err.message);
  } finally {
    pool.end();
  }
}

rollback();
