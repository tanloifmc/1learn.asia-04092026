import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error("SUPABASE_DB_URL is required for the P0 database audit.");
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  const packageResult = await client.query(
    `select version_tag, config -> 'validity_rules' as validity_rules
     from public.assessment_versions
     where version_tag = $1`,
    ["2026.1"],
  );
  const migrationColumnsResult = await client.query(
    `select column_name, data_type, udt_name
     from information_schema.columns
     where table_schema = $1 and table_name = $2
     order by ordinal_position`,
    ["supabase_migrations", "schema_migrations"],
  );
  const migrationResult = await client.query(
    `select version, name
     from supabase_migrations.schema_migrations
     order by version desc
     limit 3`,
  );

  console.log(
    JSON.stringify({
      databaseConnection: "ok",
      package: packageResult.rows[0] ?? null,
      migrationColumns: migrationColumnsResult.rows,
      latestMigrations: migrationResult.rows,
    }),
  );
} finally {
  await client.end();
}
