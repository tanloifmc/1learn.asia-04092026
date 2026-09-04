const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function run() {
  console.log("=== 1. UNIVERSITY_MAJORS ===");
  const umCount = await pool.query("SELECT COUNT(*) FROM university_majors");
  console.log("Total Actual Majors (university_majors):", umCount.rows[0].count);

  console.log("\n=== 2. MAJORS (Dictionary) ===");
  const mCount = await pool.query("SELECT COUNT(*) FROM majors");
  console.log("Total Dictionary Majors:", mCount.rows[0].count);
  
  const mDuplicates = await pool.query(`
    SELECT name, COUNT(*) 
    FROM majors 
    GROUP BY name 
    HAVING COUNT(*) > 1 
    LIMIT 5
  `);
  console.log("Sample duplicate names in majors:", mDuplicates.rows);

  console.log("\n=== 4. CAREER -> MAJOR MAPPINGS ===");
  const cCount = await pool.query("SELECT COUNT(*) FROM careers");
  const cmCount = await pool.query("SELECT COUNT(DISTINCT career_id) FROM career_major_mappings");
  console.log(`Careers: ${cCount.rows[0].count}`);
  console.log(`Careers WITH mappings: ${cmCount.rows[0].count}`);
  console.log(`Careers WITHOUT mappings: ${cCount.rows[0].count - cmCount.rows[0].count}`);
  
  const currentMappings = await pool.query(`
    SELECT c.name as career, m.name as major, cmm.relationship_type
    FROM career_major_mappings cmm
    JOIN careers c ON c.id = cmm.career_id
    JOIN majors m ON m.id = cmm.major_id
  `);
  console.log("Current Testbed Mappings:", currentMappings.rows);

  console.log("\n=== 5. CHECK 5 REAL UNIVERSITIES ===");
  const sampleUnis = await pool.query(`
    SELECT id, code, name 
    FROM universities 
    WHERE id IN (
      SELECT university_id FROM university_majors GROUP BY university_id HAVING COUNT(*) > 5
    )
    LIMIT 5
  `);
  
  for (const uni of sampleUnis.rows) {
    console.log(`\nUniversity: ${uni.code} - ${uni.name}`);
    const uMajors = await pool.query(`
      SELECT original_major_code, original_major_name, major_id, mapping_status 
      FROM university_majors 
      WHERE university_id = $1
      LIMIT 10
    `, [uni.id]);
    
    const count = await pool.query("SELECT COUNT(*) FROM university_majors WHERE university_id = $1", [uni.id]);
    console.log(`Total Actual Majors for this uni: ${count.rows[0].count}`);
    console.log("Sample Actual Majors:");
    console.table(uMajors.rows);
  }

  await pool.end();
}
run();
