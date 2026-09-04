const { Pool } = require('pg'); 
require('dotenv').config({ path: '.env.local' }); 
const pool = new Pool({ connectionString: process.env.DIRECT_URL }); 
async function run() { 
  const res = await pool.query("SELECT * FROM career_matches WHERE student_id = 'dae07307-4476-4e17-bdf8-ddb9c1419187'"); 
  console.log("Matches:", res.rows.length);
  pool.end(); 
} 
run();
