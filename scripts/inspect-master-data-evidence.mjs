import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const ids = process.argv.slice(2);
if (ids.length === 0 || ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) {
  throw new Error("Pass one or more UUID entity IDs.");
}
if (!process.env.SUPABASE_DB_URL) throw new Error("SUPABASE_DB_URL is required.");

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  const result = await client.query(`
    select entity_type, entity_id, field_path, source_name, source_url, source_sha256, review_status, import_run_id
    from public.master_data_evidence
    where entity_id = any($1::uuid[])
    order by entity_type, field_path, created_at
  `, [ids]);
  console.log(JSON.stringify({ entityIds: ids, evidence: result.rows }, null, 2));
} finally {
  await client.end();
}
