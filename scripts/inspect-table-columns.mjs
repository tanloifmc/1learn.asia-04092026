import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const table = process.argv[2];
if (!table || !/^[a-z_]+$/.test(table)) {
  throw new Error("Pass a lowercase public table name.");
}
if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  const result = await client.query(`
    select column_name, data_type, udt_name, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public' and table_name = $1
    order by ordinal_position
  `, [table]);
  console.log(JSON.stringify({ table, columns: result.rows }, null, 2));
} finally {
  await client.end();
}
