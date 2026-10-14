import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const [universitySlug, majorCode] = process.argv.slice(2);
if (!universitySlug || !majorCode) {
  throw new Error("Usage: node scripts/inspect-university-major-candidate.mjs <university-slug> <major-code>");
}
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
    select
      program.id,
      program.status,
      program.verification_status,
      program.mapping_status,
      program.source,
      program.source_url,
      program.last_verified_at,
      program.is_production_eligible,
      university.id as university_id,
      university.name as university_name,
      major.id as major_id,
      major.name as major_name,
      major.code as major_code
    from public.university_majors as program
    join public.universities as university on university.id = program.university_id
    join public.majors as major on major.id = program.major_id
    where university.slug = $1 and major.code = $2
  `, [universitySlug, majorCode]);
  console.log(JSON.stringify({ universitySlug, majorCode, matches: result.rows }, null, 2));
} finally {
  await client.end();
}
