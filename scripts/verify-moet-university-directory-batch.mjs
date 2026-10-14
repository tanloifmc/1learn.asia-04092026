import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

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

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const records = await client.query(`
    select university.id, university.name, university.status, university.verification_status,
           university.is_production_eligible, university.source, university.source_url,
           evidence.source_sha256, evidence.review_status, evidence.field_path
    from public.universities university
    left join public.master_data_evidence evidence
      on evidence.entity_type = 'university'
      and evidence.entity_id = university.id
      and evidence.field_path = 'identity'
      and evidence.source_sha256 = $1
    order by university.name
  `, [sourceSha256]);
  const indexed = new Map(records.rows.map((row) => [normalizeName(row.name), row]));
  const failures = [];
  for (const [sourceCode, sourceName, itemId] of manifest.records) {
    const row = indexed.get(normalizeName(sourceName));
    if (!row) {
      failures.push(`${sourceCode}: university record is missing`);
      continue;
    }
    if (row.status !== 'published' || row.verification_status !== 'VERIFIED' || !row.is_production_eligible) {
      failures.push(`${sourceCode}: lifecycle or eligibility state is invalid`);
    }
    if (row.source !== manifest.sourceName || row.source_url !== profileUrlFor(itemId)) {
      failures.push(`${sourceCode}: provenance source does not match the captured official directory`);
    }
    if (row.source_sha256 !== sourceSha256 || row.review_status !== 'verified' || row.field_path !== 'identity') {
      failures.push(`${sourceCode}: verified identity evidence is missing`);
    }
  }
  if (failures.length > 0) {
    throw new Error(`University directory verification failed:\n${failures.join("\n")}`);
  }
  console.log(JSON.stringify({
    passed: true,
    assertions: [
      `${manifest.records.length} official directory records matched exactly`,
      'all promoted universities have verified identity evidence tied to the source manifest hash',
      'all promoted universities have complete student-facing lifecycle and provenance state',
    ],
    sourceSha256,
  }));
} finally {
  await client.end();
}
