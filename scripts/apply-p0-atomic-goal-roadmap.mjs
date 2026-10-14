import { readFile } from "node:fs/promises";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });
if (process.env.ALLOW_DEV_DATABASE_WRITE !== "true") throw new Error("Set ALLOW_DEV_DATABASE_WRITE=true.");
if (!process.env.SUPABASE_DB_URL) throw new Error("SUPABASE_DB_URL is required.");

const version = "20260922063454";
const name = "p0_atomic_goal_roadmap_creation";
const sql = await readFile(`supabase/migrations/${version}_${name}.sql`, "utf8");
const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(sql);
  await client.query(`insert into supabase_migrations.schema_migrations(version, name) values ($1, $2) on conflict (version) do nothing`, [version, name]);
  await client.query("COMMIT");
  console.log(JSON.stringify({ applied: version, name }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
