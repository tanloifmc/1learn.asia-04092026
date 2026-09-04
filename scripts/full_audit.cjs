const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function run() {
  console.log('=== DB FULL AUDIT ===\n');

  const tables = [
    'universities', 'university_majors', 'majors', 'careers', 'career_major_mappings',
    'student_profiles', 'assessment_sessions', 'career_matches', 
    'roadmaps', 'student_goals', 'university_recommendation_runs',
    'student_university_recommendations'
  ];

  for (const t of tables) {
    try {
      const r = await pool.query(`SELECT COUNT(*) as c FROM ${t}`);
      console.log(`${t}: ${r.rows[0].c} rows`);
    } catch (e) {
      console.log(`${t}: ERROR - ${e.message}`);
    }
  }

  console.log('\n=== UNIVERSITY_MAJORS MAPPING STATUS ===');
  const um = await pool.query(`SELECT mapping_status, COUNT(*) as count FROM university_majors GROUP BY mapping_status ORDER BY count DESC`);
  console.table(um.rows);

  console.log('\n=== MAJORS FIELD BREAKDOWN ===');
  const mf = await pool.query(`SELECT field, COUNT(*) as count FROM majors GROUP BY field ORDER BY count DESC`);
  console.table(mf.rows);

  console.log('\n=== CAREERS WITH MAPPINGS ===');
  const cm = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE cmm.career_id IS NOT NULL) as with_mapping,
      COUNT(*) FILTER (WHERE cmm.career_id IS NULL) as without_mapping
    FROM careers c
    LEFT JOIN (SELECT DISTINCT career_id FROM career_major_mappings) cmm ON cmm.career_id = c.id
  `);
  console.table(cm.rows);

  console.log('\n=== STUDENT PROFILES ===');
  const sp = await pool.query(`
    SELECT COUNT(*) as total,
           COUNT(*) FILTER (WHERE riasec_profile IS NOT NULL) as has_riasec,
           COUNT(*) FILTER (WHERE target_score IS NOT NULL) as has_target_score
    FROM student_profiles
  `).catch(e => ({ rows: [{ error: e.message }] }));
  console.table(sp.rows);

  console.log('\n=== ASSESSMENT SESSIONS ===');
  const as_ = await pool.query(`SELECT status, COUNT(*) as count FROM assessment_sessions GROUP BY status`).catch(e => ({ rows: [{ error: e.message }] }));
  console.table(as_.rows);

  console.log('\n=== CAREER MATCHES ===');
  const cmatch = await pool.query(`SELECT COUNT(*) as total, COUNT(DISTINCT student_id) as unique_students FROM career_matches`).catch(e => ({ rows: [{ error: e.message }] }));
  console.table(cmatch.rows);

  console.log('\n=== ROADMAPS ===');
  const rm = await pool.query(`SELECT target_type, COUNT(*) as count FROM roadmaps GROUP BY target_type`).catch(e => ({ rows: [{ error: e.message }] }));
  console.table(rm.rows);

  console.log('\n=== TOP 5 UNIVERSITIES BY PROGRAM COUNT ===');
  const unis = await pool.query(`
    SELECT u.code, u.name, 
           COUNT(um.id) as total,
           COUNT(um.id) FILTER (WHERE um.major_id IS NOT NULL) as mapped,
           COUNT(um.id) FILTER (WHERE um.major_id IS NULL) as unmapped
    FROM universities u
    LEFT JOIN university_majors um ON um.university_id = u.id
    GROUP BY u.id, u.code, u.name
    ORDER BY total DESC LIMIT 5
  `);
  console.table(unis.rows);

  console.log('\n=== ASSESSMENT QUESTIONS EXIST? ===');
  const aq = await pool.query(`SELECT COUNT(*) as questions FROM assessment_questions`).catch(e => ({ rows: [{ error: e.message }] }));
  console.table(aq.rows);

  await pool.end();
}
run().catch(console.error);
