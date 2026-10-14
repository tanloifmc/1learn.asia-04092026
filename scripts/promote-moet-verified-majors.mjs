import dotenv from "dotenv";
import { Client } from "pg";
import {
  assessMajorsAgainstMoetCatalog,
  fetchMoetMajorCatalog,
  loadMoetMajorCatalogTranscript,
  MOET_MAJOR_CATALOG_SOURCE,
  MOET_MAJOR_CATALOG_TRANSCRIPT,
} from "./lib/moet-major-source.mjs";

dotenv.config({ path: ".env.local" });

if (process.env.ALLOW_DEV_DATABASE_WRITE !== "true") {
  throw new Error("Set ALLOW_DEV_DATABASE_WRITE=true to write the development catalog.");
}
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
  await client.query("BEGIN");

  const result = await client.query(`
    select id, code, name, slug, status, is_production_eligible
    from public.majors
    where code ~ '^[0-9]{7}$'
    order by code
    for update
  `);
  const assessment = assessMajorsAgainstMoetCatalog(result.rows, transcript.entries);
  const rejected = assessment.filter((major) => !major.isVerifiedMatch);
  if (rejected.length > 0) {
    throw new Error(`Refusing import: ${rejected.length} majors do not exactly match Thông tư 09/2022.`);
  }

  const importRun = await client.query(`
    insert into public.master_data_import_runs (
      domain, source_name, source_url, source_version, source_sha256,
      status, input_records, accepted_records, rejected_records, completed_at, notes
    ) values (
      'major', $1, $2, $3, $4,
      'completed', $5, $5, 0, now(),
      'Every promoted major matched both its seven-digit code and normalized name against a Firecrawl-captured legal-text transcript; the canonical government PDF was fetched and SHA-256 fingerprinted in this run.'
    ) returning id
  `, [
    MOET_MAJOR_CATALOG_SOURCE.name,
    MOET_MAJOR_CATALOG_SOURCE.url,
    MOET_MAJOR_CATALOG_SOURCE.version,
    officialSource.sourceSha256,
    assessment.length,
  ]);
  const importRunId = importRun.rows[0].id;

  for (const major of assessment) {
    const claim = `${major.code} — ${major.name} appears as a seven-digit undergraduate major in the catalog.`;
    const evidenceRows = [
      {
        sourceName: MOET_MAJOR_CATALOG_SOURCE.name,
        sourceUrl: MOET_MAJOR_CATALOG_SOURCE.url,
        sourceType: "official_government_document",
        sourceVersion: MOET_MAJOR_CATALOG_SOURCE.version,
        sourceSha256: officialSource.sourceSha256,
        claim: `Canonical source authority for ${claim}`,
      },
      {
        sourceName: MOET_MAJOR_CATALOG_TRANSCRIPT.name,
        sourceUrl: MOET_MAJOR_CATALOG_TRANSCRIPT.url,
        sourceType: "legal_text_transcript",
        sourceVersion: MOET_MAJOR_CATALOG_SOURCE.version,
        sourceSha256: transcript.sourceSha256,
        claim,
      },
    ];

    for (const evidence of evidenceRows) {
      await client.query(`
        insert into public.master_data_evidence (
          entity_type, entity_id, field_path, source_name, source_url, source_type,
          source_version, source_sha256, claim, review_status, verified_at, import_run_id
        ) values ('major', $1, 'identity', $2, $3, $4, $5, $6, $7, 'verified', now(), $8)
        on conflict (entity_type, entity_id, field_path, source_sha256)
        do update set review_status = 'verified', verified_at = excluded.verified_at,
          import_run_id = excluded.import_run_id, claim = excluded.claim, updated_at = now()
      `, [
        major.id,
        evidence.sourceName,
        evidence.sourceUrl,
        evidence.sourceType,
        evidence.sourceVersion,
        evidence.sourceSha256,
        evidence.claim,
        importRunId,
      ]);
    }
  }

  for (const major of assessment) {
    const update = await client.query(`
      update public.majors
      set source = $2,
          source_url = $3,
          last_verified_at = now(),
          status = 'published',
          is_production_eligible = true
      where id = $1
      returning id
    `, [major.id, MOET_MAJOR_CATALOG_SOURCE.name, MOET_MAJOR_CATALOG_SOURCE.url]);
    if (update.rowCount !== 1) {
      throw new Error(`Expected exactly one updated major for ${major.code}.`);
    }
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({
    importRunId,
    promotedMajors: assessment.length,
    officialSourceSha256: officialSource.sourceSha256,
    transcriptSha256: transcript.sourceSha256,
  }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
