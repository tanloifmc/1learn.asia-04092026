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

const [configPath] = process.argv.slice(2);
if (!configPath || process.argv.length !== 3) {
  throw new Error("Usage: node scripts/promote-verified-program-from-official-page.mjs <config.json>");
}

const config = JSON.parse(await readFile(configPath, "utf8"));
const requiredString = (value, label) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string.`);
  return value.trim();
};
const optionalString = (value, label) => value === undefined || value === null ? null : requiredString(value, label);

const source = {
  name: requiredString(config?.source?.name, "source.name"),
  url: requiredString(config?.source?.url, "source.url"),
  type: requiredString(config?.source?.type, "source.type"),
  version: requiredString(config?.source?.version, "source.version"),
};
const sourceUrl = new URL(source.url);
if (sourceUrl.protocol !== "https:") throw new Error("source.url must use HTTPS.");

const universitySlug = requiredString(config.universitySlug, "universitySlug");
const majorCode = requiredString(config.majorCode, "majorCode");
const program = {
  name: requiredString(config?.program?.name, "program.name"),
  degreeLevel: requiredString(config?.program?.degreeLevel, "program.degreeLevel"),
  campus: optionalString(config?.program?.campus, "program.campus"),
  type: requiredString(config?.program?.type, "program.type"),
  originalMajorCode: requiredString(config?.program?.originalMajorCode, "program.originalMajorCode"),
  originalMajorName: requiredString(config?.program?.originalMajorName, "program.originalMajorName"),
  claim: requiredString(config?.program?.claim, "program.claim"),
};
const requiredText = config.requiredText;
if (!Array.isArray(requiredText) || requiredText.length === 0) {
  throw new Error("requiredText must contain at least one independently checked official-page assertion.");
}
const assertions = requiredText.map((assertion, index) => requiredString(assertion, `requiredText[${index}]`));
const mappings = config.careerMappings;
if (!Array.isArray(mappings) || mappings.length === 0) {
  throw new Error("careerMappings must contain at least one source-backed relationship.");
}
const normalizedMappings = mappings.map((mapping, index) => ({
  careerCode: requiredString(mapping?.careerCode, `careerMappings[${index}].careerCode`),
  relationshipType: requiredString(mapping?.relationshipType, `careerMappings[${index}].relationshipType`),
  relevanceScore: Number(mapping?.relevanceScore),
  claim: requiredString(mapping?.claim, `careerMappings[${index}].claim`),
}));
for (const [index, mapping] of normalizedMappings.entries()) {
  if (!Number.isFinite(mapping.relevanceScore) || mapping.relevanceScore < 0 || mapping.relevanceScore > 1) {
    throw new Error(`careerMappings[${index}].relevanceScore must be between 0 and 1.`);
  }
}
if (new Set(normalizedMappings.map(({ careerCode }) => careerCode)).size !== normalizedMappings.length) {
  throw new Error("careerMappings cannot include the same career more than once.");
}

const response = await fetch(source.url, {
  headers: {
    "user-agent": "1learn-master-data-import/1.0 (+https://1learn.asia)",
    accept: "text/html,application/xhtml+xml",
  },
  redirect: "follow",
});
if (!response.ok) throw new Error(`${source.name} returned HTTP ${response.status}.`);
const sourceBody = Buffer.from(await response.arrayBuffer());
const sourceText = sourceBody.toString("utf8");
for (const assertion of assertions) {
  if (!sourceText.includes(assertion)) {
    throw new Error(`${source.name} did not contain required source text: ${assertion}`);
  }
}
const sourceSha256 = crypto.createHash("sha256").update(sourceBody).digest("hex");

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  query_timeout: 30_000,
});

try {
  await client.connect();
  await client.query("BEGIN");

  // A pg Client serializes work inside this transaction. Keep these reads
  // sequential rather than issuing concurrent client.query calls, which pg
  // deprecates and can make lock ordering ambiguous.
  const universityResult = await client.query(
    "select id from public.universities where slug = $1 for update",
    [universitySlug],
  );
  const majorResult = await client.query(
    "select id from public.majors where code = $1 for update",
    [majorCode],
  );
  const careersResult = await client.query(
    "select id, code, is_production_eligible from public.careers where code = any($1::text[]) for update",
    [normalizedMappings.map(({ careerCode }) => careerCode)],
  );
  if (universityResult.rowCount !== 1) throw new Error(`Expected exactly one university for slug ${universitySlug}.`);
  if (majorResult.rowCount !== 1) throw new Error(`Expected exactly one major for code ${majorCode}.`);
  if (careersResult.rowCount !== normalizedMappings.length) {
    throw new Error("Every mapping must reference exactly one existing career; import career identity and RIASEC evidence first.");
  }
  if (careersResult.rows.some((career) => !career.is_production_eligible)) {
    throw new Error("Every mapped career must already be production eligible; programme evidence cannot promote an unverified career.");
  }

  const universityId = universityResult.rows[0].id;
  const majorId = majorResult.rows[0].id;
  const careerIdByCode = new Map(careersResult.rows.map((career) => [career.code, career.id]));
  const programCandidates = await client.query(
    `select id, program_type, is_production_eligible
     from public.university_majors
     where university_id = $1 and major_id = $2
     for update`,
    [universityId, majorId],
  );
  const exactCandidates = programCandidates.rows.filter(({ program_type }) => program_type === program.type);
  let programId;
  if (exactCandidates.length === 1) {
    programId = exactCandidates[0].id;
  } else if (exactCandidates.length === 0 && programCandidates.rowCount === 1 && !programCandidates.rows[0].is_production_eligible) {
    programId = programCandidates.rows[0].id;
  } else if (programCandidates.rowCount === 0) {
    const insert = await client.query(
      `insert into public.university_majors (
         university_id, major_id, program_name, degree_level, campus, program_type,
         status, source, source_url, last_verified_at, verification_status,
         original_major_code, original_major_name, mapping_status
       ) values ($1, $2, $3, $4, $5, $6, 'published', $7, $8, now(), 'CURATED', $9, $10, 'CURATED')
       returning id`,
      [universityId, majorId, program.name, program.degreeLevel, program.campus, program.type, source.name, source.url, program.originalMajorCode, program.originalMajorName],
    );
    programId = insert.rows[0].id;
  } else {
    throw new Error(`Refusing programme import: ${programCandidates.rowCount} candidates are ambiguous for ${universitySlug}/${majorCode}/${program.type}.`);
  }

  await client.query(
    `update public.university_majors
     set program_name = $2, degree_level = $3, campus = $4, program_type = $5,
         status = 'published', source = $6, source_url = $7, last_verified_at = now(),
         verification_status = 'CURATED', original_major_code = $8,
         original_major_name = $9, mapping_status = 'CURATED'
     where id = $1`,
    [programId, program.name, program.degreeLevel, program.campus, program.type, source.name, source.url, program.originalMajorCode, program.originalMajorName],
  );

  const programRun = await client.query(
    `insert into public.master_data_import_runs (
       domain, source_name, source_url, source_version, source_sha256, status,
       input_records, accepted_records, rejected_records, completed_at, notes
     ) values ('university_major', $1, $2, $3, $4, 'completed', 1, 1, 0, now(), $5)
     returning id`,
    [source.name, source.url, source.version, sourceSha256, `Official programme import for ${universitySlug}/${majorCode}; source assertions passed before database promotion.`],
  );
  await client.query(
    `insert into public.master_data_evidence (
       entity_type, entity_id, field_path, source_name, source_url, source_type,
       source_version, source_sha256, claim, review_status, verified_at, import_run_id
     ) values ('university_major', $1, 'programme', $2, $3, $4, $5, $6, $7, 'verified', now(), $8)
     on conflict (entity_type, entity_id, field_path, source_sha256) do update set
       source_name = excluded.source_name, source_url = excluded.source_url, source_type = excluded.source_type,
       source_version = excluded.source_version, claim = excluded.claim, review_status = 'verified',
       verified_at = now(), import_run_id = excluded.import_run_id, updated_at = now()`,
    [programId, source.name, source.url, source.type, source.version, sourceSha256, program.claim, programRun.rows[0].id],
  );

  const mappingRun = await client.query(
    `insert into public.master_data_import_runs (
       domain, source_name, source_url, source_version, source_sha256, status,
       input_records, accepted_records, rejected_records, completed_at, notes
     ) values ('career_major_mapping', $1, $2, $3, $4, 'completed', $5, $5, 0, now(), $6)
     returning id`,
    [source.name, source.url, source.version, sourceSha256, normalizedMappings.length, `Official programme outcomes support ${normalizedMappings.length} reviewed career-to-major relationship(s).`],
  );
  const mappingIds = [];
  for (const mapping of normalizedMappings) {
    const mappingResult = await client.query(
      `insert into public.career_major_mappings (
         career_id, major_id, relationship_type, relevance_score, source, source_url, status, last_verified_at
       ) values ($1, $2, $3, $4, $5, $6, 'published', now())
       on conflict (career_id, major_id) do update set relationship_type = excluded.relationship_type,
         relevance_score = excluded.relevance_score, source = excluded.source, source_url = excluded.source_url,
         status = 'published', last_verified_at = now()
       returning id`,
      [careerIdByCode.get(mapping.careerCode), majorId, mapping.relationshipType, mapping.relevanceScore, source.name, source.url],
    );
    const mappingId = mappingResult.rows[0].id;
    mappingIds.push(mappingId);
    await client.query(
      `insert into public.master_data_evidence (
         entity_type, entity_id, field_path, source_name, source_url, source_type,
         source_version, source_sha256, claim, review_status, verified_at, import_run_id
       ) values ('career_major_mapping', $1, 'relationship', $2, $3, $4, $5, $6, $7, 'verified', now(), $8)
       on conflict (entity_type, entity_id, field_path, source_sha256) do update set
         source_name = excluded.source_name, source_url = excluded.source_url, source_type = excluded.source_type,
         source_version = excluded.source_version, claim = excluded.claim, review_status = 'verified',
         verified_at = now(), import_run_id = excluded.import_run_id, updated_at = now()`,
      [mappingId, source.name, source.url, source.type, source.version, sourceSha256, mapping.claim, mappingRun.rows[0].id],
    );
  }

  await client.query("update public.university_majors set is_production_eligible = true where id = $1", [programId]);
  for (const mappingId of mappingIds) {
    await client.query("update public.career_major_mappings set is_production_eligible = true where id = $1", [mappingId]);
  }
  await client.query("COMMIT");
  console.log(JSON.stringify({
    configPath,
    sourceSha256,
    programId,
    mappingIds,
    importRunIds: { universityMajor: programRun.rows[0].id, careerMajorMappings: mappingRun.rows[0].id },
  }, null, 2));
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
