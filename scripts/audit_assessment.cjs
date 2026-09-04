require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function audit() {
  // 1. What are the 2 assessments?
  const assessments = await pool.query('SELECT id, code, name FROM assessments');
  console.log('\n[ASSESSMENTS]');
  console.table(assessments.rows);

  // 2. What are the 2 versions (status field is actually version_tag)?
  const versions = await pool.query('SELECT id, assessment_id, version_tag, status, scoring_rules_version FROM assessment_versions');
  console.log('\n[VERSIONS]');
  console.table(versions.rows);

  // 3. Questions by module & dimension
  const qByModule = await pool.query(`
    SELECT aq.module, ad.framework, ad.code as dimension, count(aq.id) as count
    FROM assessment_questions aq
    LEFT JOIN assessment_dimensions ad ON aq.dimension_id = ad.id
    GROUP BY aq.module, ad.framework, ad.code
    ORDER BY aq.module, ad.framework, ad.code
  `);
  console.log('\n[QUESTIONS by MODULE & DIMENSION]');
  console.table(qByModule.rows);

  // 4. Dimensions by framework
  const dims = await pool.query('SELECT framework, code, name FROM assessment_dimensions ORDER BY framework, code');
  console.log('\n[DIMENSIONS by FRAMEWORK]');
  console.table(dims.rows);

  // 5. Sessions breakdown
  const sessions = await pool.query('SELECT status, count(*) FROM assessment_sessions GROUP BY status');
  console.log('\n[SESSIONS]');
  console.table(sessions.rows);

  // 6. Check responses vs questions (only 5 responses but 121 questions — suspicious)
  const responses = await pool.query(`
    SELECT s.status as session_status, count(r.id) as responses
    FROM assessment_sessions s
    LEFT JOIN assessment_responses r ON r.session_id = s.id
    GROUP BY s.status
  `);
  console.log('\n[RESPONSES per session status]');
  console.table(responses.rows);

  // 7. Results - any that are is_current?
  const results = await pool.query('SELECT is_current, count(*) FROM assessment_results GROUP BY is_current');
  console.log('\n[RESULTS - is_current breakdown]');
  console.table(results.rows);

  pool.end();
}
audit().catch(console.error);
