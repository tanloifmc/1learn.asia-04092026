const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function run() {
  // Find a student who has completed an assessment
  const res = await pool.query(`
    SELECT student_id 
    FROM assessment_sessions 
    WHERE status = 'completed' 
    LIMIT 1
  `);
  
  if (res.rows.length === 0) {
    console.log("No completed assessments found.");
    return;
  }
  
  const userId = res.rows[0].student_id;
  console.log("Found student with completed assessment:", userId);
  
  // Trigger Backend APIs
  console.log('Triggering E2E Flow via local API...');
  const triggerRes = await fetch('http://localhost:3000/api/e2e-trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  
  const result = await triggerRes.json();
  console.log('E2E Result:', JSON.stringify(result, null, 2));

  if (!result.success) {
    console.error("E2E FAILED!");
  } else {
    console.log("E2E SUCCEEDED!");
  }
  pool.end();
}

run();
