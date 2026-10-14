import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });
if (!process.env.SUPABASE_DB_URL) throw new Error("SUPABASE_DB_URL is required.");

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  query_timeout: 10_000,
});
try {
  await client.connect();
  const tables = await client.query(`
    select table_schema, table_name
    from information_schema.tables
    where table_name = 'schema_migrations'
    order by table_schema
  `);
  const columns = await client.query(`
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'supabase_migrations' and table_name = 'schema_migrations'
    order by ordinal_position
  `);
  console.log(JSON.stringify({ migrationTables: tables.rows, migrationHistoryColumns: columns.rows }, null, 2));
} finally {
  await client.end();
}
