import assert from "node:assert/strict";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required for the verification.");
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  const migration = await client.query(
    `select 1 from supabase_migrations.schema_migrations
     where version = '20260922134140' and name = 'master_data_foundation_integrity'`,
  );
  const rlsPatch = await client.query(
    `select 1 from supabase_migrations.schema_migrations
     where version = '20260922134708' and name = 'close_master_data_rls_bypass'`,
  );
  const evidenceMigration = await client.query(
    `select 1 from supabase_migrations.schema_migrations
     where version = '20260922145634' and name = 'master_data_evidence_provenance'`,
  );
  const program = await client.query(`
    select program.id, program.is_production_eligible, university.id as university_id, major.id as major_id
    from public.university_majors program
    join public.universities university on university.id = program.university_id
    join public.majors major on major.id = program.major_id
    where university.slug = 'rmit-university-vietnam'
      and major.slug = 'cu-nhan-kinh-doanh-rmit'
  `);
  const policies = await client.query(`
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('careers', 'majors', 'universities', 'university_majors', 'career_major_mappings', 'admission_data', 'target_requirements', 'master_data_import_runs')
  `);
  const importTable = await client.query(`
    select relrowsecurity as rls_enabled
    from pg_class
    where oid = 'public.master_data_import_runs'::regclass
  `);
  const evidenceTable = await client.query(`
    select relrowsecurity as rls_enabled
    from pg_class
    where oid = 'public.master_data_evidence'::regclass
  `);
  const rmitEvidence = await client.query(`
    select entity_type, field_path, review_status
    from public.master_data_evidence
    where entity_id in ($1, $2, $3)
      and review_status = 'verified'
    order by entity_type, field_path
  `, [program.rows[0]?.id, program.rows[0]?.major_id, program.rows[0]?.university_id]);

  assert.equal(migration.rowCount, 1, "Migration is not recorded.");
  assert.equal(rlsPatch.rowCount, 1, "RLS bypass patch is not recorded.");
  assert.equal(evidenceMigration.rowCount, 1, "Evidence migration is not recorded.");
  assert.equal(program.rowCount, 1, "The source-backed RMIT program is missing.");
  assert.equal(program.rows[0].is_production_eligible, true, "The verified RMIT program is not eligible.");
  assert.equal(importTable.rows[0]?.rls_enabled, true, "Import audit table does not have RLS enabled.");
  assert.equal(evidenceTable.rows[0]?.rls_enabled, true, "Evidence table does not have RLS enabled.");
  assert.deepEqual(
    rmitEvidence.rows.map(({ entity_type, field_path }) => `${entity_type}:${field_path}`),
    ["major:identity", "university:identity", "university_major:programme"],
    "The RMIT programme chain does not have complete verified evidence.",
  );

  const expectedPolicies = [
    "Public can view production-eligible careers",
    "Public can view production-eligible majors",
    "Public can view production-eligible universities",
    "Public can view production-eligible university majors",
    "Public can view production-eligible career-major mappings",
    "Public can view production-eligible admission data",
    "Public can read production-eligible requirements",
    "Admins can read master-data import runs",
  ];
  const actualPolicies = new Set(policies.rows.map((row) => row.policyname));
  for (const policy of expectedPolicies) {
    assert.ok(actualPolicies.has(policy), `Missing RLS policy: ${policy}`);
  }
  assert.equal(actualPolicies.has("Public read careers"), false, "Legacy public careers policy is still active.");

  await client.query("BEGIN");
  try {
    const changedProgram = await client.query(
      `update public.university_majors
       set program_name = coalesce(program_name, '') || ' [integrity probe]'
       where id = $1
       returning is_production_eligible`,
      [program.rows[0].id],
    );
    assert.equal(
      changedProgram.rows[0]?.is_production_eligible,
      false,
      "A material program change did not revoke production eligibility.",
    );

    let rejected = false;
    try {
      await client.query(`
        insert into public.careers (
          code, name, slug, career_domain_code, status, is_production_eligible
        ) values (
          'INTEGRITY_PROBE', 'Integrity probe', 'integrity-probe', 'test', 'verified', true
        )
      `);
    } catch {
      rejected = true;
    }
    assert.equal(rejected, true, "Database accepted an eligible career without provenance.");
  } finally {
    await client.query("ROLLBACK");
  }

  console.log(JSON.stringify({
    passed: true,
    assertions: [
      "migration recorded",
      "verified program remains eligible",
      "student-facing RLS policies installed",
      "import-run RLS enabled",
      "evidence migration and RLS enabled",
      "RMIT programme chain has verified field-level evidence",
      "material changes revoke eligibility",
      "eligible rows require provenance",
    ],
  }));
} finally {
  await client.end();
}
