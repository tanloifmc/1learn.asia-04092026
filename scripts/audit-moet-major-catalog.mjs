import dotenv from "dotenv";
import { Client } from "pg";
import { assessMajorsAgainstMoetCatalog, fetchMoetMajorCatalog, loadMoetMajorCatalogTranscript, MOET_MAJOR_CATALOG_SOURCE, MOET_MAJOR_CATALOG_TRANSCRIPT } from "./lib/moet-major-source.mjs";

dotenv.config({ path: ".env.local" });
if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const [source, transcript] = await Promise.all([
    fetchMoetMajorCatalog(),
    loadMoetMajorCatalogTranscript(),
  ]);
  await client.connect();
  const majors = await client.query(`
    select id, code, name, slug, status, is_production_eligible
    from public.majors
    where code ~ '^[0-9]{7}$'
    order by code
  `);
  const assessment = assessMajorsAgainstMoetCatalog(majors.rows, transcript.entries);
  const exactMatches = assessment.filter((major) => major.isVerifiedMatch);
  const codeOnlyMatches = assessment.filter((major) => major.codeFound && !major.exactNameFound);
  const unmatched = assessment.filter((major) => !major.codeFound);

  console.log(JSON.stringify({
    source: {
      ...MOET_MAJOR_CATALOG_SOURCE,
      sourceSha256: source.sourceSha256,
      bytes: source.bytes,
    },
    transcript: {
      ...MOET_MAJOR_CATALOG_TRANSCRIPT,
      sourceSha256: transcript.sourceSha256,
      bytes: transcript.bytes,
    },
    databaseMajorRecordsChecked: assessment.length,
    exactMatches: exactMatches.length,
    codeOnlyMatches: codeOnlyMatches.map(({ code, name }) => ({ code, name })),
    unmatched: unmatched.map(({ code, name }) => ({ code, name })),
  }, null, 2));
} finally {
  await client.end();
}
