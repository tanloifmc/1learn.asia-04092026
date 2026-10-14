import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error("SUPABASE_DB_URL is required for the P0 analytics schema audit.");
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  const columns = await client.query(
    `select column_name, data_type, is_nullable, column_default
     from information_schema.columns
     where table_schema = $1 and table_name = $2
     order by ordinal_position`,
    ["public", "analytics_events"],
  );
  const migrations = await client.query(
    `select version, name
     from supabase_migrations.schema_migrations
     where version in ($1, $2)
     order by version`,
    ["20260827000005", "20260828000000"],
  );
  const policies = await client.query(
    `select policyname, cmd, roles
     from pg_policies
     where schemaname = $1 and tablename = $2
     order by policyname`,
    ["public", "analytics_events"],
  );

  console.log(JSON.stringify({ databaseConnection: "ok", columns: columns.rows, migrations: migrations.rows, policies: policies.rows }));
} finally {
  await client.end();
}
