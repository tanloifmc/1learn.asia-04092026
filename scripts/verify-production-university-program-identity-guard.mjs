import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const { Client } = pg;
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  query_timeout: 10_000,
});

try {
  await client.connect();
  const migration = await client.query(
    "select version, name from supabase_migrations.schema_migrations where version = $1",
    ["20260923054102"],
  );
  const constraint = await client.query(`
      select pg_get_constraintdef(con.oid) as definition
      from pg_constraint con
      join pg_class relation on relation.oid = con.conrelid
      join pg_namespace schema on schema.oid = relation.relnamespace
      where schema.nspname = 'public'
        and relation.relname = 'university_majors'
        and con.conname = 'university_majors_eligible_program_type_required'
    `);
  const index = await client.query(`
      select indexdef
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'university_majors'
        and indexname = 'university_majors_production_eligible_identity_unique_idx'
    `);
  const invalidEligiblePrograms = await client.query(`
      select count(*)::int as count
      from public.university_majors
      where is_production_eligible
        and coalesce(nullif(btrim(program_type), ''), '') = ''
    `);
  const duplicateEligiblePrograms = await client.query(`
      select count(*)::int as count
      from (
        select university_id, major_id, nullif(btrim(program_type), '')
        from public.university_majors
        where is_production_eligible
        group by university_id, major_id, nullif(btrim(program_type), '')
        having count(*) > 1
      ) as conflicts
    `);

  const result = {
    migrationRecorded: migration.rowCount === 1,
    checkConstraintPresent: constraint.rowCount === 1,
    uniquePartialIndexPresent:
      index.rowCount === 1 && /UNIQUE INDEX/i.test(index.rows[0].indexdef) && /WHERE is_production_eligible/i.test(index.rows[0].indexdef),
    eligibleProgramsMissingType: invalidEligiblePrograms.rows[0].count,
    duplicateEligibleProgramIdentities: duplicateEligiblePrograms.rows[0].count,
  };
  const passed =
    result.migrationRecorded &&
    result.checkConstraintPresent &&
    result.uniquePartialIndexPresent &&
    result.eligibleProgramsMissingType === 0 &&
    result.duplicateEligibleProgramIdentities === 0;

  console.log(JSON.stringify({ passed, ...result }, null, 2));
  if (!passed) process.exitCode = 1;
} finally {
  await client.end();
}
