import crypto from "node:crypto";
import dotenv from "dotenv";
import { Client } from "pg";
import { moetUniversityDirectorySourceName, moetUniversityDirectoryUrl, normalizeMoetUniversityName, readMoetUniversityDirectory } from "./lib/moet-university-directory.mjs";

dotenv.config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const sourceRows = await readMoetUniversityDirectory();

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
    const key = normalizeMoetUniversityName(candidate.name);
    const candidates = candidatesByNormalizedName.get(key) ?? [];
    candidates.push(candidate);
    candidatesByNormalizedName.set(key, candidates);
  }

  const assessment = sourceRows.map((source) => {
    const candidates = candidatesByNormalizedName.get(normalizeMoetUniversityName(source.name)) ?? [];
    return {
      ...source,
      candidates,
      status: candidates.length === 1 ? "matched" : candidates.length === 0 ? "unmatched" : "ambiguous",
    };
  });
  const matched = assessment.filter((record) => record.status === "matched");
  const unmatched = assessment.filter((record) => record.status === "unmatched");
  const ambiguous = assessment.filter((record) => record.status === "ambiguous");

  console.log(JSON.stringify({
    source: {
      sourceName: moetUniversityDirectorySourceName,
      sourceUrl: moetUniversityDirectoryUrl,
      sourceSha256: crypto.createHash("sha256").update(JSON.stringify(sourceRows)).digest("hex"),
      records: sourceRows.length,
    },
    totals: {
      databaseUniversities: result.rowCount,
      matched: matched.length,
      unmatched: unmatched.length,
      ambiguous: ambiguous.length,
    },
    unmatched: unmatched.map(({ ordinal, code, name, detailUrl }) => ({ ordinal, code, name, detailUrl })),
    ambiguous: ambiguous.map(({ ordinal, code, name, detailUrl, candidates }) => ({ ordinal, code, name, detailUrl, candidates })),
  }, null, 2));
} finally {
  await client.end();
}
