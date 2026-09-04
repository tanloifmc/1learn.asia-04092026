import fs from 'fs';
import pg from 'pg';
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Set DATABASE_URL in .env.local to use this script
// e.g. DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-...supabase.com:5432/postgres
const DIRECT_URL = process.env.DATABASE_URL;

async function run() {
  if (!DIRECT_URL) {
    console.error("❌ DATABASE_URL not set in .env.local");
    process.exit(1);
  }
  const sql = fs.readFileSync('supabase/migrations/20260904234500_add_university_ui_columns.sql', 'utf8');
  const client = new pg.Client({ connectionString: DIRECT_URL });
  await client.connect();
  console.log("Connected to DB, running migration...");
  await client.query(sql);
  console.log("Migration applied, notifying pgrst...");
  await client.query("NOTIFY pgrst, 'reload schema';");
  console.log("Done.");
  await client.end();
}
run();
