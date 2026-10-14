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

if (!Array.isArray(manifest.records) || manifest.records.length === 0) {
  throw new Error("The source manifest must contain at least one official directory record.");
}

const codes = manifest.records.map(([code]) => code);
if (new Set(codes).size !== codes.length) {
  throw new Error("The source manifest contains duplicate official institution codes.");
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const result = await client.query(`
    select id, name, slug, short_name, status, verification_status, is_production_eligible
    from public.universities
    order by name
  `);
  const candidatesByNormalizedName = new Map();
  for (const candidate of result.rows) {
    const key = normalizeName(candidate.name);
    const candidates = candidatesByNormalizedName.get(key) ?? [];
    candidates.push(candidate);
    candidatesByNormalizedName.set(key, candidates);
  }

  const assessment = manifest.records.map(([sourceCode, sourceName, itemId]) => {
    const candidates = candidatesByNormalizedName.get(normalizeName(sourceName)) ?? [];
    return {
      sourceCode,
      sourceName,
      itemId,
      candidates,
      status: candidates.length === 1 ? "matched" : candidates.length === 0 ? "unmatched" : "ambiguous",
    };
  });
  const matched = assessment.filter((record) => record.status === "matched");
  const unmatched = assessment.filter((record) => record.status === "unmatched");
  const ambiguous = assessment.filter((record) => record.status === "ambiguous");

  console.log(JSON.stringify({
    source: {
      sourceName: manifest.sourceName,
      sourceUrl: manifest.sourceUrl,
      retrievedAt: manifest.retrievedAt,
      sourceSha256,
      directoryTotalItems: manifest.totalItems,
      batchItems: manifest.records.length,
    },
    totals: {
      databaseUniversities: result.rowCount,
      matched: matched.length,
      unmatched: unmatched.length,
      ambiguous: ambiguous.length,
    },
    matched: matched.map(({ sourceCode, sourceName, itemId, candidates }) => ({
      sourceCode,
      sourceName,
      itemId,
      university: candidates[0],
    })),
    unmatched: unmatched.map(({ sourceCode, sourceName, itemId }) => ({ sourceCode, sourceName, itemId })),
    ambiguous: ambiguous.map(({ sourceCode, sourceName, itemId, candidates }) => ({
      sourceCode,
      sourceName,
      itemId,
      candidates,
    })),
  }, null, 2));
} finally {
  await client.end();
}
