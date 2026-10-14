import { readFile } from "node:fs/promises";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

if (process.env.ALLOW_DEV_DATABASE_WRITE !== "true") {
  throw new Error("Set ALLOW_DEV_DATABASE_WRITE=true to apply this Dev database migration.");
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DB_URL is required to apply the P0 analytics migration.");
}

const version = "20260922014028";
const name = "repair_analytics_events_v2_schema";
const sql = await readFile(`supabase/migrations/${version}_${name}.sql`, "utf8");
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(sql);
  await client.query(
    `insert into supabase_migrations.schema_migrations(version, name)
     values ($1, $2)
     on conflict (version) do nothing`,
    [version, name],
  );
  await client.query("COMMIT");
  console.log(JSON.stringify({ applied: version, name }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
