import crypto from "node:crypto";
import dotenv from "dotenv";
import { Client } from "pg";
import { moetUniversityDirectorySourceName, normalizeMoetUniversityName, readMoetUniversityDirectory } from "./lib/moet-university-directory.mjs";

dotenv.config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const sourceRows = await readMoetUniversityDirectory();
const sourceSha256 = crypto.createHash("sha256").update(JSON.stringify(sourceRows)).digest("hex");
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const [universities, run] = await Promise.all([
    client.query(`
      select
        university.id,
        university.name,
        university.verification_status,
        university.is_production_eligible,
        evidence.source_url as evidence_source_url,
        evidence.review_status as evidence_review_status
      from public.universities as university
      left join public.master_data_evidence as evidence
        on evidence.entity_type = 'university'
        and evidence.entity_id = university.id
        and evidence.field_path = 'identity'
        and evidence.source_sha256 = $1
        and evidence.source_name = $2
    `, [sourceSha256, moetUniversityDirectorySourceName]),
    client.query(`
      select id, input_records, accepted_records, rejected_records, status
      from public.master_data_import_runs
      where domain = 'university' and source_sha256 = $1
      order by completed_at desc nulls last
      limit 1
    `, [sourceSha256]),
  ]);

  const byNormalizedName = new Map();
  for (const university of universities.rows) {
    const key = normalizeMoetUniversityName(university.name);
    const candidates = byNormalizedName.get(key) ?? [];
    candidates.push(university);
    byNormalizedName.set(key, candidates);
  }

  const failures = sourceRows.flatMap((source) => {
    const candidates = byNormalizedName.get(normalizeMoetUniversityName(source.name)) ?? [];
    if (candidates.length !== 1) {
      return [{ code: source.code, name: source.name, reason: `expected one database match, received ${candidates.length}` }];
    }
    const university = candidates[0];
    const reasons = [];
    if (university.verification_status !== "VERIFIED") reasons.push("verification_status is not VERIFIED");
    if (!university.is_production_eligible) reasons.push("is_production_eligible is not true");
    if (university.evidence_source_url !== source.detailUrl) reasons.push("evidence source URL does not equal official record URL");
    if (university.evidence_review_status !== "verified") reasons.push("identity evidence is not verified");
    return reasons.length ? [{ code: source.code, name: source.name, reason: reasons.join("; ") }] : [];
  });
  const evidenceCount = universities.rows.filter((university) => university.evidence_review_status === "verified").length;
  const importRun = run.rows[0] ?? null;
  const importRunIsValid = importRun
    && importRun.status === "completed"
    && importRun.input_records === 327
    && importRun.accepted_records === 327
    && importRun.rejected_records === 0;

  const report = {
    sourceSha256,
    officialDirectoryRecords: sourceRows.length,
    verifiedSourceRecords: sourceRows.length - failures.length,
    sourceHashEvidenceRecords: evidenceCount,
    importRun,
    importRunIsValid,
    failures,
  };
  console.log(JSON.stringify(report, null, 2));
  if (failures.length > 0 || evidenceCount !== 327 || !importRunIsValid) {
    throw new Error("MoET university promotion verification failed.");
  }
} finally {
  await client.end();
}
