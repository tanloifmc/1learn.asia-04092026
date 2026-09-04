const { Pool } = require('pg'); 
require('dotenv').config({ path: '.env.local' }); 
const pool = new Pool({ connectionString: process.env.DIRECT_URL }); 
async function run() { 
  const res = await pool.query("SELECT * FROM majors WHERE id = '726c99e2-d2b8-441f-b686-38132dc0ddb9'"); 
  console.log('Major:', res.rows[0]);
  
  const res2 = await pool.query("SELECT * FROM university_majors WHERE major_id = '726c99e2-d2b8-441f-b686-38132dc0ddb9'");
  console.log('University Majors:', res2.rows);

  // Let's find a major that HAS a university AND is mapped to a career that our student matches!
  pool.end(); 
} 
run();
