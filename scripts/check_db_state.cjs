require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function check() {
  const [completed, signals, responses, realSession] = await Promise.all([
    pool.query("SELECT count(*) FROM assessment_sessions WHERE status='completed'"),
    pool.query("SELECT count(*) FROM derived_profile_signals"),
    pool.query("SELECT count(*) FROM assessment_responses"),
    pool.query("SELECT id FROM assessment_sessions WHERE id IN (SELECT session_id FROM assessment_responses GROUP BY session_id HAVING count(*) = 5)")
  ]);
  
  console.log('Completed Sessions:', completed.rows[0].count);
  console.log('Fake Signals:', signals.rows[0].count);
  console.log('Total Responses:', responses.rows[0].count);
  console.log('Real session (5 responses):', realSession.rows[0] ? 'EXISTS' : 'MISSING');
  pool.end();
}

check();
