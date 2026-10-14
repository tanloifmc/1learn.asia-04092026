import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const migrationFile = process.argv[2];
const migrationMatch = /^(\d{14})_([a-z0-9-]+)\.sql$/i.exec(migrationFile ?? "");

dotenv.config({ path: ".env.local" });

if (process.env.ALLOW_DEV_DATABASE_WRITE !== "true") {
  throw new Error("Refusing database write: set ALLOW_DEV_DATABASE_WRITE=true.");
}

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

if (!migrationMatch) {
  throw new Error("Pass one migration filename in YYYYMMDDHHMMSS_name.sql format.");
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.join(projectRoot, "supabase", "migrations", migrationFile);
const sql = await readFile(migrationPath, "utf8");

if (!sql.trim()) {
  throw new Error("Refusing to apply an empty migration.");
}

const { Client } = pg;
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  query_timeout: 30_000,
});

const [version, name] = migrationMatch.slice(1);

await client.connect();
try {
  await client.query("begin");
  const existing = await client.query(
    "select version, name from supabase_migrations.schema_migrations where version = $1 for update",
    [version],
  );

  if (existing.rowCount) {
    await client.query("rollback");
    console.log(JSON.stringify({ status: "already_applied", version, name: existing.rows[0].name }, null, 2));
  } else {
    await client.query(sql);
    await client.query(
      "insert into supabase_migrations.schema_migrations (version, statements, name) values ($1, $2::text[], $3)",
      [version, [sql], name],
    );
    await client.query("commit");
    console.log(JSON.stringify({ status: "applied", version, name }, null, 2));
  }
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
