const { Pool } = require('pg'); 
require('dotenv').config({ path: '.env.local' }); 
const pool = new Pool({ connectionString: process.env.DIRECT_URL }); 
async function run() { 
  const res = await pool.query("SELECT id, code, name, education_paths FROM careers LIMIT 5"); 
  console.log(JSON.stringify(res.rows, null, 2));
  
  const cnt = await pool.query("SELECT COUNT(*) FROM careers WHERE education_paths IS NOT NULL AND jsonb_array_length(education_paths) > 0");
  console.log("Careers with education paths:", cnt.rows[0].count);
  
  pool.end(); 
} 
run();
