const { Pool } = require('pg'); 
require('dotenv').config({ path: '.env.local' }); 
const pool = new Pool({ connectionString: process.env.DIRECT_URL }); 
async function run() { 
  const res = await pool.query(`
    SELECT cm.career_id, cm.match_score, c.code, c.name
    FROM career_matches cm
    JOIN careers c ON c.id = cm.career_id
    JOIN match_runs mr ON mr.id = cm.run_id
    WHERE mr.student_id = 'dae07307-4476-4e17-bdf8-ddb9c1419187'
    ORDER BY cm.match_score DESC
    LIMIT 10
  `); 
  console.table(res.rows);
  pool.end(); 
} 
run();
