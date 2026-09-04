const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  console.error("DIRECT_URL not found");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

async function runMigration() {
  const sql = fs.readFileSync('supabase/migrations/20260829000001_phase16_data_provenance_and_lifecycle.sql', 'utf8');
  console.log("Running migration...");
  
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch(e) {
    console.error("Migration failed:", e);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
