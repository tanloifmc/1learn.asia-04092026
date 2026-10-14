import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required for the P0 report schema audit.");
}

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  const tables = await client.query(
    `select table_name
     from information_schema.tables
     where table_schema = $1 and table_name = any($2::text[])
     order by table_name`,
    ["public", ["profiles", "student_profiles", "student_career_profiles", "student_reports"]],
  );
  const foreignKeys = await client.query(
    `select tc.table_name, tc.constraint_name, kcu.column_name, ccu.table_name as foreign_table_name
     from information_schema.table_constraints tc
     join information_schema.key_column_usage kcu
       on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
     join information_schema.constraint_column_usage ccu
       on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
     where tc.table_schema = $1 and tc.constraint_type = 'FOREIGN KEY'
       and tc.table_name = any($2::text[])
     order by tc.table_name, tc.constraint_name`,
    ["public", ["student_career_profiles", "student_reports"]],
  );
  const migrations = await client.query(
    `select version, name from supabase_migrations.schema_migrations order by version desc limit 12`,
  );
  const triggers = await client.query(
    `select trigger_name, event_manipulation, action_statement
     from information_schema.triggers
     where event_object_schema = $1 and event_object_table = $2`,
    ["auth", "users"],
  );
  console.log(JSON.stringify({ databaseConnection: "ok", tables: tables.rows, foreignKeys: foreignKeys.rows, latestMigrations: migrations.rows, triggers: triggers.rows }));
} finally {
  await client.end();
}
