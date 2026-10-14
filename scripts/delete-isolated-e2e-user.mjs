import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const userId = process.argv[2];
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId ?? "")) {
  throw new Error("Pass exactly one UUID for an isolated E2E user.");
}
if (process.env.ALLOW_DEV_E2E_DATABASE_WRITES !== "true") {
  throw new Error("Set ALLOW_DEV_E2E_DATABASE_WRITES=true to delete an isolated E2E user.");
}
if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  const result = await client.query(
    `delete from auth.users
      where id = $1
        and exists (select 1 from public.profiles where id = $1 and is_demo = true)
      returning id`,
    [userId],
  );
  if (result.rowCount !== 1) throw new Error("Refusing to delete a user that is not an isolated E2E demo account.");
  console.log(JSON.stringify({ deletedUserId: result.rows[0].id }));
} finally {
  await client.end();
}
