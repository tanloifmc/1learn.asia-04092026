const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ 
  connectionString: process.env.DIRECT_URL, 
  connectionTimeoutMillis: 30000 
});

async function run() {
  console.log('=== PART 1: SCHEMA CHECK ===\n');

  // ALL PUBLIC TABLES
  const allTables = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log('ALL PUBLIC TABLES:');
  allTables.rows.forEach(r => console.log(' -', r.table_name));

  // KEY TABLE SCHEMAS
  const schemaChecks = [
    'student_profiles', 'career_matches', 'roadmaps', 
    'student_career_profiles', 'derived_profile_signals',
    'careers', 'match_runs', 'university_majors'
  ];

  for (const tbl of schemaChecks) {
    const r = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
      [tbl]
    ).catch(e => ({ rows: [{ column_name: 'ERROR: ' + e.message }] }));
    const cols = r.rows.map(row => row.column_name).join(', ');
    console.log(`\n${tbl}: [${cols}]`);
  }

  // ---- FLOW 1: Assessment → Profile ----
  console.log('\n\n=== FLOW 1: Assessment → Profile ===');
  const completedSessions = await pool.query(
    `SELECT id, student_id, status, version_id FROM assessment_sessions WHERE status = 'completed' LIMIT 3`
  ).catch(e => ({ rows: [] }));
  console.log(`Completed sessions: ${completedSessions.rows.length}`);
  
  const signals = await pool.query(
    `SELECT student_id, signal_type, value, valid_until FROM derived_profile_signals LIMIT 5`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.log('Derived profile signals sample:');
  console.table(signals.rows);

  const careerProfiles = await pool.query(
    `SELECT student_id, profile_version, evidence_coverage, is_current FROM student_career_profiles ORDER BY profile_version DESC LIMIT 5`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.log('student_career_profiles:');
  console.table(careerProfiles.rows);

  // ---- FLOW 2: Profile → Career Matches ----
  console.log('\n=== FLOW 2: Profile → Career (Matching Engine) ===');
  const matchRuns = await pool.query(
    `SELECT id, student_id, status, algorithm_version, evidence_coverage, overall_confidence_level FROM match_runs LIMIT 5`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.log('match_runs:');
  console.table(matchRuns.rows);

  const careerMatchCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'career_matches' ORDER BY ordinal_position`
  ).catch(e => ({ rows: [{ column_name: 'ERROR: ' + e.message }] }));
  const cmCols = careerMatchCols.rows.map(r => r.column_name).join(', ');
  console.log(`career_matches columns: [${cmCols}]`);

  const careerMatchCount = await pool.query(
    `SELECT COUNT(*) as total FROM career_matches`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.log('career_matches count:');
  console.table(careerMatchCount.rows);

  // ---- FLOW 3: Career → Major ----
  console.log('\n=== FLOW 3: Career → Major Mapping ===');
  const cmmDetail = await pool.query(
    `SELECT cmm.career_id, c.name as career_name, m.name as major_name, cmm.fit_level
     FROM career_major_mappings cmm
     JOIN careers c ON c.id = cmm.career_id
     JOIN majors m ON m.id = cmm.major_id LIMIT 6`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.table(cmmDetail.rows);

  const careersNoMapping = await pool.query(
    `SELECT COUNT(*) as total_published_careers,
     COUNT(DISTINCT cmm.career_id) as careers_with_major_mapping
     FROM careers c
     LEFT JOIN career_major_mappings cmm ON cmm.career_id = c.id
     WHERE c.status = 'published'`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.log('Career→Major mapping coverage:');
  console.table(careersNoMapping.rows);

  // ---- FLOW 4: Major → University ----
  console.log('\n=== FLOW 4: Major → University ===');
  const mappingStats = await pool.query(
    `SELECT mapping_status, COUNT(*) as count FROM university_majors GROUP BY mapping_status`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.table(mappingStats.rows);

  // Sample accepted matches using correct column name
  const sampleMapped = await pool.query(
    `SELECT u.name as uni_name, m.name as mapped_major_name, um.program_name as raw_program_name
     FROM university_majors um
     LEFT JOIN universities u ON u.id = um.university_id
     LEFT JOIN majors m ON m.id = um.major_id
     WHERE um.mapping_status = 'ACCEPTED_MATCH'
     LIMIT 5`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.log('Sample ACCEPTED_MATCH:');
  console.table(sampleMapped.rows);

  const sampleUnmapped = await pool.query(
    `SELECT u.name as uni_name, um.program_name, um.original_major_name
     FROM university_majors um
     LEFT JOIN universities u ON u.id = um.university_id
     WHERE um.mapping_status = 'UNMAPPED'
     LIMIT 5`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.log('Sample UNMAPPED:');
  console.table(sampleUnmapped.rows);

  // ---- FLOW 5: University → Roadmap ----
  console.log('\n=== FLOW 5: University → Roadmap ===');
  const roadmapCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'roadmaps' ORDER BY ordinal_position`
  ).catch(e => ({ rows: [{ column_name: 'ERROR: ' + e.message }] }));
  const rdCols = roadmapCols.rows.map(r => r.column_name).join(', ');
  console.log(`roadmaps columns: [${rdCols}]`);

  const roadmaps = await pool.query(
    `SELECT id, student_id, status FROM roadmaps LIMIT 5`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.log('Roadmaps:');
  console.table(roadmaps.rows);

  const milestoneCount = await pool.query(`SELECT COUNT(*) as milestones FROM roadmap_milestones`).catch(e => ({ rows: [{ error: e.message }] }));
  const taskCount = await pool.query(`SELECT COUNT(*) as tasks FROM roadmap_tasks`).catch(e => ({ rows: [{ error: e.message }] }));
  console.log(`Roadmap milestones: ${milestoneCount.rows[0]?.milestones || milestoneCount.rows[0]?.error}`);
  console.log(`Roadmap tasks: ${taskCount.rows[0]?.tasks || taskCount.rows[0]?.error}`);

  // ---- University Recommendations ----
  console.log('\n=== University Recommendations ===');
  const uniRecs = await pool.query(`SELECT COUNT(*) as total FROM student_university_recommendations`).catch(e => ({ rows: [{ error: e.message }] }));
  const uniRecRuns = await pool.query(`SELECT COUNT(*) as total FROM university_recommendation_runs`).catch(e => ({ rows: [{ error: e.message }] }));
  console.log(`student_university_recommendations: ${uniRecs.rows[0]?.total || uniRecs.rows[0]?.error}`);
  console.log(`university_recommendation_runs: ${uniRecRuns.rows[0]?.total || uniRecRuns.rows[0]?.error}`);

  // ---- Majors coverage across universities ----
  console.log('\n=== Majors coverage across universities ===');
  const majorCoverage = await pool.query(
    `SELECT m.name as major_name, 
     COUNT(DISTINCT um.university_id) FILTER (WHERE um.mapping_status = 'ACCEPTED_MATCH') as mapped_universities,
     COUNT(DISTINCT um.university_id) as total_universities_listing
     FROM majors m
     LEFT JOIN university_majors um ON um.major_id = m.id
     GROUP BY m.id, m.name ORDER BY mapped_universities DESC LIMIT 15`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.table(majorCoverage.rows);

  // ---- Check student_profiles actual schema ----
  console.log('\n=== student_profiles ACTUAL COLUMNS ===');
  const spCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'student_profiles' ORDER BY ordinal_position`
  ).catch(e => ({ rows: [{ column_name: 'ERROR: ' + e.message }] }));
  const spColList = spCols.rows.map(r => r.column_name).join(', ');
  console.log(`[${spColList}]`);

  const spSample = await pool.query(
    `SELECT id, user_id, grade FROM student_profiles LIMIT 3`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.table(spSample.rows);

  await pool.end();
}

run().catch(console.error);
