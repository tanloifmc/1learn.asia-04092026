const { Pool } = require('pg'); 
require('dotenv').config({ path: '.env.local' }); 
const pool = new Pool({ connectionString: process.env.DIRECT_URL }); 
async function run() { 
  const res = await pool.query("SELECT id, code, status FROM careers LIMIT 5"); 
  console.table(res.rows);
  const countRes = await pool.query("SELECT status, COUNT(*) FROM careers GROUP BY status");
  console.table(countRes.rows);
  pool.end(); 
} 
run();
