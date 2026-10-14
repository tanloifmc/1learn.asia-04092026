import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

if (process.env.ALLOW_DEV_DATABASE_WRITE !== "true") {
  throw new Error("Set ALLOW_DEV_DATABASE_WRITE=true to write the development catalog.");
}
if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const manifestPath = new URL("../data/master-data/moet-university-directory-page-4.json", import.meta.url);
const manifestBuffer = await readFile(manifestPath);
const manifest = JSON.parse(manifestBuffer.toString("utf8"));
const sourceSha256 = crypto.createHash("sha256").update(manifestBuffer).digest("hex");

const normalizeName = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

const profileUrlFor = (itemId) =>
  `https://moet.gov.vn/cosogiaoduc/Pages/danh-sach.aspx%3FItemID=${itemId}`;

if (!Array.isArray(manifest.records) || manifest.records.length === 0) {
  throw new Error("The source manifest must contain at least one official directory record.");
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query("BEGIN");

  const candidates = await client.query(`
    select id, name
    from public.universities
    order by name
    for update
  `);
  const candidatesByNormalizedName = new Map();
  for (const candidate of candidates.rows) {
    const key = normalizeName(candidate.name);
    const matches = candidatesByNormalizedName.get(key) ?? [];
    matches.push(candidate);
    candidatesByNormalizedName.set(key, matches);
  }

  const assessment = manifest.records.map(([sourceCode, sourceName, itemId]) => {
    const matches = candidatesByNormalizedName.get(normalizeName(sourceName)) ?? [];
    return { sourceCode, sourceName, itemId, matches };
  });
  const rejected = assessment.filter(({ matches }) => matches.length !== 1);
  if (rejected.length > 0) {
    throw new Error(`Refusing promotion: ${rejected.length} records are unmatched or ambiguous.`);
  }

  const importRun = await client.query(`
    insert into public.master_data_import_runs (
      domain, source_name, source_url, source_version, source_sha256,
      status, input_records, accepted_records, rejected_records, completed_at, notes
    ) values (
      'university', $1, $2, $3, $4,
      'completed', $5, $5, 0, now(),
      'Exact normalized-name match against the captured public Ministry of Education and Training directory; individual profile URLs carry the official institution code.'
    ) returning id
  `, [
    manifest.sourceName,
    manifest.sourceUrl,
    `captured-${manifest.retrievedAt}`,
    sourceSha256,
    assessment.length,
  ]);
  const importRunId = importRun.rows[0].id;

  for (const record of assessment) {
    const universityId = record.matches[0].id;
    const profileUrl = profileUrlFor(record.itemId);
    const claim = `${record.sourceName} appears in the Ministry directory with official code ${record.sourceCode}; the linked profile identifies the same institution.`;

    await client.query(`
      insert into public.master_data_evidence (
        entity_type, entity_id, field_path, source_name, source_url, source_type,
        source_version, source_sha256, claim, review_status, verified_at, import_run_id
      ) values (
        'university', $1, 'identity', $2, $3, 'official_government_directory',
        $4, $5, $6, 'verified', now(), $7
      )
      on conflict (entity_type, entity_id, field_path, source_sha256)
      do update set source_url = excluded.source_url, claim = excluded.claim,
        review_status = 'verified', verified_at = excluded.verified_at,
        import_run_id = excluded.import_run_id, updated_at = now()
    `, [
      universityId,
      manifest.sourceName,
      profileUrl,
      `captured-${manifest.retrievedAt}`,
      sourceSha256,
      claim,
      importRunId,
    ]);

    const update = await client.query(`
      update public.universities
      set source = $2,
          source_url = $3,
          status = 'published',
          verification_status = 'VERIFIED',
          last_verified_at = now(),
          is_production_eligible = true
      where id = $1
      returning id
    `, [universityId, manifest.sourceName, profileUrl]);
    if (update.rowCount !== 1) {
      throw new Error(`Expected exactly one university update for ${record.sourceCode}.`);
    }
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({
    importRunId,
    promotedUniversities: assessment.length,
    sourceSha256,
  }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
