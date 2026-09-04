const { Pool } = require('pg'); 
require('dotenv').config({ path: '.env.local' }); 
const pool = new Pool({ connectionString: process.env.DIRECT_URL }); 
async function run() { 
  const res = await pool.query("SELECT u.name as uni, m.name as major, um.original_major_name, um.program_name FROM university_majors um LEFT JOIN majors m ON um.major_id = m.id LEFT JOIN universities u ON um.university_id = u.id WHERE um.original_major_name = 'Unknown Major' LIMIT 10"); 
  console.table(res.rows); 
  
  // If they have a major name from relation, we update it.
  const updateRes = await pool.query(`
    UPDATE university_majors um
    SET original_major_name = m.name
    FROM majors m
    WHERE um.major_id = m.id 
      AND um.original_major_name = 'Unknown Major'
  `);
  console.log('Updated rows using major relation:', updateRes.rowCount);
  pool.end(); 
} 
run();
