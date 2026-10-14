import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const result = await client.query(`
    select u.id, u.email, u.created_at
    from auth.users u
    join public.profiles p on p.id = u.id
    where p.is_demo = true
      and (u.email like 'student_test_%@example.invalid' or u.email like 'parent_test_%@example.invalid')
    order by u.created_at asc
  `);
  console.log(JSON.stringify({ isolatedE2eUsers: result.rows }, null, 2));
} finally {
  await client.end();
}
