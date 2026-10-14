import assert from "node:assert/strict";
import dotenv from "dotenv";
import { Client } from "pg";
import { fetchMoetMajorCatalog, loadMoetMajorCatalogTranscript, MOET_MAJOR_CATALOG_SOURCE } from "./lib/moet-major-source.mjs";

dotenv.config({ path: ".env.local" });
if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const [officialSource, transcript] = await Promise.all([
    fetchMoetMajorCatalog(),
    loadMoetMajorCatalogTranscript(),
  ]);
  await client.connect();
  const majors = await client.query(`
      select count(*)::int as total,
        count(*) filter (where is_production_eligible)::int as eligible,
        count(*) filter (
          where is_production_eligible
            and source = $1
            and source_url = $2
            and last_verified_at is not null
        )::int as sourced
      from public.majors
      where code ~ '^[0-9]{7}$'
    `, [MOET_MAJOR_CATALOG_SOURCE.name, MOET_MAJOR_CATALOG_SOURCE.url]);
  const evidence = await client.query(`
      select count(*)::int as evidence_count,
        count(distinct evidence.entity_id)::int as entities,
        count(*) filter (where source_sha256 = $1)::int as official_evidence,
        count(*) filter (where source_sha256 = $2)::int as transcript_evidence
      from public.master_data_evidence evidence
      join public.majors major on major.id = evidence.entity_id
      where evidence.entity_type = 'major'
        and field_path = 'identity'
        and review_status = 'verified'
        and major.code ~ '^[0-9]{7}$'
    `, [officialSource.sourceSha256, transcript.sourceSha256]);
  const importRun = await client.query(`
      select accepted_records, rejected_records, source_sha256
      from public.master_data_import_runs
      where domain = 'major'
        and source_url = $1
        and source_sha256 = $2
      order by completed_at desc
      limit 1
    `, [MOET_MAJOR_CATALOG_SOURCE.url, officialSource.sourceSha256]);

  const majorCounts = majors.rows[0];
  const evidenceCounts = evidence.rows[0];
  assert.equal(majorCounts.total, 377, "Unexpected numeric major count; stop and review source scope.");
  assert.equal(majorCounts.eligible, 377, "Not all verified majors became eligible.");
  assert.equal(majorCounts.sourced, 377, "Promoted majors have incomplete canonical provenance.");
  assert.equal(evidenceCounts.entities, 377, "Each promoted major needs evidence.");
  assert.equal(evidenceCounts.official_evidence, 377, "Each promoted major needs canonical PDF evidence.");
  assert.equal(evidenceCounts.transcript_evidence, 377, "Each promoted major needs transcript evidence.");
  assert.deepEqual(importRun.rows[0], {
    accepted_records: 377,
    rejected_records: 0,
    source_sha256: officialSource.sourceSha256,
  }, "Major import audit run is incomplete.");

  console.log(JSON.stringify({
    passed: true,
    assertions: [
      "377 seven-digit majors exactly matched before promotion",
      "all promoted majors retain canonical government provenance",
      "each promoted major has canonical and transcript evidence",
      "import audit reports 377 accepted and 0 rejected",
    ],
  }));
} finally {
  await client.end();
}
