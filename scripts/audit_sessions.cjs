require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function audit() {
  // 1. Who created the 9 completed sessions? real users or scripts?
  const completedSessions = await pool.query(`
    SELECT 
      s.id, s.student_id, s.started_at, s.completed_at, s.updated_at,
      p.email
    FROM assessment_sessions s
    LEFT JOIN auth.users p ON p.id = s.student_id
    WHERE s.status = 'completed'
    ORDER BY s.completed_at
  `);
  console.log('\n[COMPLETED SESSIONS — who are they?]');
  console.table(completedSessions.rows);

  // 2. Cross-check: for each completed session, how many responses?
  const sessionsVsResponses = await pool.query(`
    SELECT s.id as session_id, s.student_id, s.status, 
           count(r.id) as response_count
    FROM assessment_sessions s
    LEFT JOIN assessment_responses r ON r.session_id = s.id
    GROUP BY s.id, s.student_id, s.status
    ORDER BY s.status, response_count DESC
  `);
  console.log('\n[SESSIONS vs RESPONSES COUNT]');
  console.table(sessionsVsResponses.rows);

  // 3. For the 5 responses that exist, what session are they in?
  const existingResponses = await pool.query(`
    SELECT r.session_id, r.question_id, r.response_value, r.answered_at,
           s.status as session_status
    FROM assessment_responses r
    JOIN assessment_sessions s ON s.id = r.session_id
    ORDER BY r.answered_at
  `);
  console.log('\n[EXISTING RESPONSES (all 5)]');
  console.table(existingResponses.rows);

  // 4. Derived signals - are they linked to real results?
  const signalSummary = await pool.query(`
    SELECT signal_type, count(*), source_type
    FROM derived_profile_signals
    GROUP BY signal_type, source_type
    ORDER BY signal_type
    LIMIT 20
  `);
  console.log('\n[DERIVED SIGNALS summary]');
  console.table(signalSummary.rows);

  pool.end();
}
audit().catch(console.error);
