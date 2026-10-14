import crypto from "node:crypto";
import dotenv from "dotenv";
import { Client } from "pg";
import { moetUniversityDirectorySourceName, moetUniversityDirectoryUrl, normalizeMoetUniversityName, readMoetUniversityDirectory } from "./lib/moet-university-directory.mjs";

dotenv.config({ path: ".env.local" });

if (process.env.ALLOW_DEV_DATABASE_WRITE !== "true") {
  throw new Error("Set ALLOW_DEV_DATABASE_WRITE=true to write the development catalog.");
}
if (!process.env.SUPABASE_DB_URL) throw new Error("SUPABASE_DB_URL is required.");

const sourceName = moetUniversityDirectorySourceName;
const sourceRows = await readMoetUniversityDirectory();
const sourceSha256 = crypto.createHash("sha256").update(JSON.stringify(sourceRows)).digest("hex");
console.log(JSON.stringify({ stage: "source-validated", sourceRows: sourceRows.length, sourceSha256 }));
const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query("BEGIN");
  const candidates = await client.query("select id, name from public.universities for update");
  const byName = new Map();
  for (const row of candidates.rows) byName.set(normalizeMoetUniversityName(row.name), [...(byName.get(normalizeMoetUniversityName(row.name)) ?? []), row]);
  const matches = sourceRows.map((source) => ({ source, candidates: byName.get(normalizeMoetUniversityName(source.name)) ?? [] }));
  const rejected = matches.filter(({ candidates }) => candidates.length !== 1);
  if (rejected.length) throw new Error(`Refusing promotion: ${rejected.length} official records are unmatched or ambiguous.`);
  console.log(JSON.stringify({ stage: "database-validated", matchedUniversities: matches.length }));
  const run = await client.query(`insert into public.master_data_import_runs (domain,source_name,source_url,source_version,source_sha256,status,input_records,accepted_records,rejected_records,completed_at,notes) values ('university',$1,$2,'live-directory-2026-09-23',$3,'completed',327,327,0,now(),'Live browser extraction of all four official Ministry directory pages; exact normalized-name match required.') returning id`, [sourceName, moetUniversityDirectoryUrl, sourceSha256]);
  const promotionRows = matches.map(({ source, candidates: [university] }) => ({
    id: university.id,
    name: source.name,
    code: source.code,
    sourceUrl: source.detailUrl,
  }));
  const promotionRowsJson = JSON.stringify(promotionRows);
  await client.query(`
    insert into public.master_data_evidence (
      entity_type, entity_id, field_path, source_name, source_url, source_type,
      source_version, source_sha256, claim, review_status, verified_at, import_run_id
    )
    select
      'university',
      (record->>'id')::uuid,
      'identity',
      $2,
      record->>'sourceUrl',
      'official_government_directory',
      'live-directory-2026-09-23',
      $3,
      (record->>'name') || ' appears in the Ministry directory with official code ' || (record->>'code') || '.',
      'verified',
      now(),
      $4
    from jsonb_array_elements($1::jsonb) as record
    on conflict (entity_type, entity_id, field_path, source_sha256) do update
      set source_url = excluded.source_url,
          claim = excluded.claim,
          review_status = 'verified',
          verified_at = now(),
          import_run_id = excluded.import_run_id,
          updated_at = now()
  `, [promotionRowsJson, sourceName, sourceSha256, run.rows[0].id]);
  await client.query(`
    update public.universities as university
    set source = $2,
        source_url = record.source_url,
        status = 'published',
        verification_status = 'VERIFIED',
        last_verified_at = now(),
        is_production_eligible = true
    from jsonb_to_recordset($1::jsonb) as record(id uuid, source_url text)
    where university.id = record.id
  `, [JSON.stringify(promotionRows.map((row) => ({ id: row.id, source_url: row.sourceUrl }))), sourceName]);
  await client.query("COMMIT");
  console.log(JSON.stringify({ importRunId: run.rows[0].id, sourceRows: sourceRows.length, promotedUniversities: matches.length, sourceSha256 }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
