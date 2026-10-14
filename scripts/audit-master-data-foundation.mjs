import dotenv from "dotenv";
import pg from "pg";

const { Pool } = pg;
dotenv.config({ path: ".env.local" });
const summaryMode = process.argv.includes("--summary");

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required for the master-data audit.");
}

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });
const tables = [
  "careers",
  "majors",
  "universities",
  "university_majors",
  "career_major_mappings",
  "target_requirements",
  "admission_data",
  "master_data_import_runs",
  "master_data_evidence",
];

try {
  const [tableResult, columnResult, constraintResult] = await Promise.all([
    pool.query(
      `select table_name
       from information_schema.tables
       where table_schema = 'public' and table_name = any($1)
       order by table_name`,
      [tables],
    ),
    pool.query(
      `select table_name, column_name, data_type, udt_name, is_nullable, column_default
       from information_schema.columns
       where table_schema = 'public' and table_name = any($1)
       order by table_name, ordinal_position`,
      [tables],
    ),
    pool.query(
      `select c.relname as table_name, con.conname, pg_get_constraintdef(con.oid) as definition
       from pg_constraint con
       join pg_class c on c.oid = con.conrelid
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = any($1)
       order by c.relname, con.conname`,
      [tables],
    ),
  ]);

  const existingTables = tableResult.rows.map(({ table_name }) => table_name);
  const columnsByTable = Object.groupBy(columnResult.rows, ({ table_name }) => table_name);
  const hasColumn = (table, column) =>
    (columnsByTable[table] ?? []).some(({ column_name }) => column_name === column);

  const metrics = {};
  for (const table of existingTables) {
    if (hasColumn(table, "status") || hasColumn(table, "verification_status")) {
      const dimensions = [];
      if (hasColumn(table, "status")) dimensions.push("status::text");
      if (hasColumn(table, "verification_status")) dimensions.push("verification_status::text");
      const grouped = await pool.query(
        `select ${dimensions.join(", ")}, count(*)::int as records
         from public.${table}
         group by ${dimensions.join(", ")}
         order by ${dimensions.join(", ")}`,
      );
      metrics[table] = { grouped: grouped.rows };
    } else {
      const total = await pool.query(`select count(*)::int as total from public.${table}`);
      metrics[table] = { total: total.rows[0].total };
    }
  }

  if (existingTables.includes("university_majors")) {
    metrics.university_major_link_integrity = (
      await pool.query(`
        select
          count(*)::int as total,
          count(*) filter (where university_id is not null)::int as with_university,
          count(*) filter (where major_id is not null)::int as with_major,
          count(*) filter (where university_id is not null and major_id is not null)::int as fully_linked,
          count(*) filter (where source_url is not null and btrim(source_url) <> '')::int as with_source_url,
          count(*) filter (where last_verified_at is not null)::int as with_verification_time,
          count(*) filter (where verification_status in ('VERIFIED', 'CURATED'))::int as verified_or_curated,
          count(*) filter (where status = 'published')::int as published
        from public.university_majors
      `)
    ).rows[0];
  }

  if (existingTables.includes("career_major_mappings")) {
    metrics.career_major_link_integrity = (
      await pool.query(`
        select
          count(*)::int as total,
          count(*) filter (where career_id is not null and major_id is not null)::int as fully_linked
        from public.career_major_mappings
      `)
    ).rows[0];
  }

  if (existingTables.includes("target_requirements")) {
    metrics.production_target_requirements = (
      await pool.query(`
        select
          count(*)::int as total,
          count(*) filter (where is_production_eligible)::int as production_eligible,
          count(*) filter (
            where is_production_eligible
              and status in ('verified', 'published')
              and nullif(btrim(source_url), '') is not null
              and last_verified_at is not null
          )::int as eligible_with_complete_provenance
        from public.target_requirements
      `)
    ).rows[0];
  }

  if (existingTables.includes("master_data_evidence")) {
    metrics.evidence_coverage = (
      await pool.query(`
        select
          entity_type,
          review_status,
          count(*)::int as records,
          count(distinct entity_id)::int as entities
        from public.master_data_evidence
        group by entity_type, review_status
        order by entity_type, review_status
      `)
    ).rows;
  }

  metrics.production_catalog_coverage = {
    careers: (
      await pool.query(`
        select count(*)::int as total,
          count(*) filter (where is_production_eligible)::int as eligible,
          count(*) filter (where is_production_eligible and nullif(btrim(source_url), '') is not null and last_verified_at is not null)::int as eligible_with_provenance
        from public.careers
      `)
    ).rows[0],
    majors: (
      await pool.query(`
        select count(*)::int as total,
          count(*) filter (where is_production_eligible)::int as eligible,
          count(*) filter (where is_production_eligible and nullif(btrim(source_url), '') is not null and last_verified_at is not null)::int as eligible_with_provenance
        from public.majors
      `)
    ).rows[0],
    universities: (
      await pool.query(`
        select count(*)::int as total,
          count(*) filter (where is_production_eligible)::int as eligible,
          count(*) filter (where is_production_eligible and nullif(btrim(source_url), '') is not null and last_verified_at is not null)::int as eligible_with_provenance
        from public.universities
      `)
    ).rows[0],
    university_majors: (
      await pool.query(`
        select count(*)::int as total,
          count(*) filter (where is_production_eligible)::int as eligible,
          count(*) filter (where is_production_eligible and nullif(btrim(source_url), '') is not null and last_verified_at is not null)::int as eligible_with_provenance
        from public.university_majors
      `)
    ).rows[0],
    career_major_mappings: (
      await pool.query(`
        select count(*)::int as total,
          count(*) filter (where is_production_eligible)::int as eligible,
          count(*) filter (where is_production_eligible and nullif(btrim(source_url), '') is not null and last_verified_at is not null)::int as eligible_with_provenance
        from public.career_major_mappings
      `)
    ).rows[0],
  };

  const policies = await pool.query(
    `select tablename, policyname, roles, cmd, qual
     from pg_policies
     where schemaname = 'public' and tablename = any($1)
     order by tablename, policyname`,
    [tables],
  );

  const report = {
    audited_at: new Date().toISOString(),
    existing_tables: existingTables,
    columns: columnsByTable,
    constraints: constraintResult.rows,
    policies: policies.rows,
    metrics,
  };

  console.log(JSON.stringify(summaryMode ? {
    audited_at: report.audited_at,
    existing_tables: report.existing_tables,
    metrics: report.metrics,
  } : report, null, 2));
} finally {
  await pool.end();
}
