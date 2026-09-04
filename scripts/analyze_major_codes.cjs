const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
async function run() {
  // Sample unique original_major_codes from university_majors
  const r = await pool.query(`
    SELECT DISTINCT original_major_code, original_major_name, COUNT(*) as uni_count
    FROM university_majors
    WHERE original_major_code IS NOT NULL
    AND original_major_code ~ '^[0-9]'
    GROUP BY original_major_code, original_major_name
    ORDER BY original_major_code
    LIMIT 30
  `);
  console.log('Sample codes (first 30):');
  console.table(r.rows);
  
  // Count code patterns
  const c = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE original_major_code ~ '^7[0-9]{6}$') as valid_7digit,
      COUNT(*) FILTER (WHERE original_major_code NOT ~ '^7[0-9]{6}$') as other_format,
      COUNT(*) FILTER (WHERE original_major_code IS NULL) as null_code,
      COUNT(DISTINCT original_major_code) as unique_codes
    FROM university_majors
  `);
  console.log('Code format breakdown:', c.rows[0]);
  
  // What are the non-7digit codes?
  const nc = await pool.query(`
    SELECT DISTINCT original_major_code, original_major_name
    FROM university_majors
    WHERE original_major_code NOT ~ '^7[0-9]{6}$'
    AND original_major_code IS NOT NULL
    LIMIT 20
  `);
  console.log('Non-standard codes:');
  console.table(nc.rows);
  
  await pool.end();
}
run().catch(console.error);
