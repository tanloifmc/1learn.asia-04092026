require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function auditData() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  
  // 1. Careers
  const { rows: careers } = await pool.query("SELECT status, count(*) FROM careers GROUP BY status");
  console.log("Careers:", careers);

  // 2. Mappings
  const { rows: mappings } = await pool.query("SELECT status, count(*) FROM career_major_mappings GROUP BY status");
  console.log("Career-Major Mappings:", mappings);

  // 3. University Majors
  const { rows: uniMajors } = await pool.query("SELECT count(*) FROM university_majors");
  console.log("University Majors:", uniMajors);

  // 4. Target Requirements
  const { rows: reqs } = await pool.query("SELECT target_type, requirement_code, count(*) FROM target_requirements GROUP BY target_type, requirement_code");
  console.log("Target Requirements:", reqs);

  pool.end();
}

auditData().catch(console.error);
