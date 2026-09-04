require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function check() {
  const query = `
    SELECT 
      c.name as career_name, 
      m.name as major_name, 
      cmm.relevance_score, 
      cmm.relationship_type, 
      cmm.source
    FROM career_major_mappings cmm
    JOIN careers c ON c.id = cmm.career_id
    JOIN majors m ON m.id = cmm.major_id
  `;
  try {
    const result = await pool.query(query);
    console.table(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
check();
