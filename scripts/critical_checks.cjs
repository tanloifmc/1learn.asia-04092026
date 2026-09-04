const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_URL, connectionTimeoutMillis: 30000 });

async function run() {
  // Check assessment_versions actual columns
  const avCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,
    ['assessment_versions']
  );
  console.log('assessment_versions columns:', avCols.rows.map(r => r.column_name).join(', '));

  const avSample = await pool.query(`SELECT id, status FROM assessment_versions LIMIT 3`);
  console.log('assessment_versions:');
  console.table(avSample.rows);

  // Check published careers count  
  const publishedCareers = await pool.query(`SELECT COUNT(*) as total FROM careers WHERE status=$1`, ['published']);
  console.log('Published careers:', publishedCareers.rows[0].total);

  // Check if career_major_mappings has fit_level  
  const cmmFitLevel = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`,
    ['career_major_mappings', 'fit_level']
  );
  console.log('career_major_mappings.fit_level exists:', cmmFitLevel.rows.length > 0);

  // Check career_major_mappings sample
  const cmmSample = await pool.query(`SELECT * FROM career_major_mappings LIMIT 6`);
  console.log('career_major_mappings sample:');
  console.table(cmmSample.rows);

  // Check student_profiles - does it have a FK to auth.users or profiles?
  const profilesFk = await pool.query(`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.key_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'student_profiles' AND tc.constraint_type = 'FOREIGN KEY'
  `);
  console.log('student_profiles FK:');
  console.table(profilesFk.rows);

  // Check profiles table (the one FK might point to)  
  const profilesCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,
    ['profiles']
  );
  console.log('profiles columns:', profilesCols.rows.map(r => r.column_name).join(', '));

  // Check if roadmap_tasks has correct columns
  const rtCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,
    ['roadmap_tasks']
  );
  console.log('roadmap_tasks columns:', rtCols.rows.map(r => r.column_name).join(', '));

  // Check if roadmap_milestones has correct columns
  const rmCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,
    ['roadmap_milestones']
  );
  console.log('roadmap_milestones columns:', rmCols.rows.map(r => r.column_name).join(', '));

  // Check the setPrimaryGoalAndGenerateRoadmapAction endpoint
  // Check if student_goals.is_primary exists
  const sgPrimary = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`,
    ['student_goals', 'is_primary']
  );
  console.log('student_goals.is_primary exists:', sgPrimary.rows.length > 0);

  // Check if journey page uses roadmaps correctly
  const roadmapSample = await pool.query(`SELECT id, student_id, status, target_career_id FROM roadmaps LIMIT 3`);
  console.log('roadmaps sample:');
  console.table(roadmapSample.rows);

  // Check roadmap milestones sample
  const milestoneSample = await pool.query(
    `SELECT id, roadmap_id, title, status, order_index, target_date FROM roadmap_milestones LIMIT 5`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.log('roadmap_milestones sample:');
  console.table(milestoneSample.rows);

  // Check roadmap tasks sample 
  const taskSample = await pool.query(
    `SELECT id, milestone_id, title, status, due_date, priority FROM roadmap_tasks LIMIT 5`
  ).catch(e => ({ rows: [{ error: e.message }] }));
  console.log('roadmap_tasks sample:');
  console.table(taskSample.rows);

  await pool.end();
}

run().catch(console.error);
