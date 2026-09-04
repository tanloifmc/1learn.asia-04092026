const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
async function run() {
  await client.connect();
  let res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assessment_results';");
  console.log("assessment_results columns:", res.rows);
  res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student_career_profiles';");
  console.log("student_career_profiles columns:", res.rows);
  await client.end();
}
run();
