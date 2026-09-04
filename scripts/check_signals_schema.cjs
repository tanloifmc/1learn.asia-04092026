const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
async function run() {
  await client.connect();
  let res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assessment_signals';");
  console.log("assessment_signals columns:", res.rows);
  await client.end();
}
run();
