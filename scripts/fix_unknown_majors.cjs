const { Pool } = require('pg'); 
require('dotenv').config({ path: '.env.local' }); 
const pool = new Pool({ connectionString: process.env.DIRECT_URL }); 
async function run() { 
  const res = await pool.query("SELECT id, university_id, original_major_name, program_name FROM university_majors WHERE original_major_name = 'Unknown Major' LIMIT 10"); 
  console.table(res.rows); 
  const updateRes = await pool.query("UPDATE university_majors SET original_major_name = program_name WHERE original_major_name = 'Unknown Major' AND program_name IS NOT NULL");
  console.log('Updated rows:', updateRes.rowCount);
  pool.end(); 
} 
run();
