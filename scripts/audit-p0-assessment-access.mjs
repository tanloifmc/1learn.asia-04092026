import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required for the P0 assessment access audit.");
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const result = await client.query(
    `select tablename, policyname, cmd, qual, with_check
     from pg_policies
     where schemaname = $1
       and tablename = any($2::text[])
     order by tablename, policyname`,
    ["public", ["assessment_versions", "assessment_dimensions", "assessment_questions", "assessment_sessions", "assessment_responses"]],
  );
  console.log(JSON.stringify({ databaseConnection: "ok", policies: result.rows }));
} finally {
  await client.end();
}
