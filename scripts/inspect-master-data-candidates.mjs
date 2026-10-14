import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const search = process.argv[2];
if (!search || search.length < 2 || search.length > 80) {
  throw new Error("Pass a search term from 2 to 80 characters.");
}
if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
const pattern = `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;

try {
  await client.connect();
  const careers = await client.query(`
      select id, code, name, name_en, slug, career_domain_code, status, source, source_url,
             last_verified_at, riasec_profile, is_production_eligible
      from public.careers
      where name ilike $1 escape '\\' or code ilike $1 escape '\\' or slug ilike $1 escape '\\'
      order by name
      limit 25
    `, [pattern]);
  const majors = await client.query(`
      select id, code, name, slug, field, status, source, source_url,
             last_verified_at, is_production_eligible
      from public.majors
      where name ilike $1 escape '\\' or code ilike $1 escape '\\' or slug ilike $1 escape '\\'
      order by name
      limit 25
    `, [pattern]);
  const universities = await client.query(`
      select id, name, slug, short_name, status, verification_status, source, source_url,
             last_verified_at, is_production_eligible
      from public.universities
      where name ilike $1 escape '\\' or slug ilike $1 escape '\\' or short_name ilike $1 escape '\\'
      order by name
      limit 25
    `, [pattern]);

  console.log(JSON.stringify({
    search,
    careers: careers.rows,
    majors: majors.rows,
    universities: universities.rows,
  }, null, 2));
} finally {
  await client.end();
}
