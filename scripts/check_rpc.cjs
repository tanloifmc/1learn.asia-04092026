const { Pool } = require('pg'); 
require('dotenv').config({ path: '.env.local' }); 
const pool = new Pool({ connectionString: process.env.DIRECT_URL }); 
async function run() { 
  const res = await pool.query(`
    SELECT prosrc 
    FROM pg_proc 
    WHERE proname = 'save_assessment_result'
  `); 
  console.log(res.rows[0]?.prosrc || 'RPC not found');
  pool.end(); 
} 
run();
