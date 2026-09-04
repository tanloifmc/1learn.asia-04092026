const { Pool } = require('pg'); 
require('dotenv').config({ path: '.env.local' }); 
const pool = new Pool({ connectionString: process.env.DIRECT_URL }); 
async function run() { 
  const cRes = await pool.query("SELECT code, name FROM careers WHERE id = '07c81c2c-0f71-42c4-891c-778ba6c89c2c'"); 
  console.log("Matched Career:", cRes.rows[0]);
  
  const mRes = await pool.query("SELECT COUNT(*) FROM majors WHERE status = 'published'");
  console.log("Published Majors:", mRes.rows[0].count);
  pool.end(); 
} 
run();
