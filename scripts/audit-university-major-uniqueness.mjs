import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) throw new Error("SUPABASE_DB_URL is required.");

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  const pairDuplicates = await client.query(`
    with duplicates as (
      select university_id, major_id, count(*)::integer as records
      from public.university_majors
      group by university_id, major_id
      having count(*) > 1
    )
    select count(*)::integer as groups, coalesce(sum(records - 1), 0)::integer as surplus_records
    from duplicates
  `);
  const pairDuplicateSamples = await client.query(`
    select university_id, major_id, count(*)::integer as records, array_agg(id order by created_at) as ids
    from public.university_majors
    group by university_id, major_id
    having count(*) > 1
    order by count(*) desc, university_id, major_id
    limit 10
  `);
  const programTypeDuplicates = await client.query(`
    with duplicates as (
      select university_id, major_id, program_type, count(*)::integer as records
      from public.university_majors
      group by university_id, major_id, program_type
      having count(*) > 1
    )
    select count(*)::integer as groups, coalesce(sum(records - 1), 0)::integer as surplus_records
    from duplicates
  `);
  const nullProgramTypes = await client.query(`
    select count(*)::integer as records
    from public.university_majors
    where program_type is null
  `);
  console.log(JSON.stringify({
    pairDuplicates: pairDuplicates.rows[0],
    pairDuplicateSamples: pairDuplicateSamples.rows,
    programTypeDuplicates: programTypeDuplicates.rows[0],
    nullProgramTypeRecords: nullProgramTypes.rows[0].records,
  }, null, 2));
} finally {
  await client.end();
}
