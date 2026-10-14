import crypto from "node:crypto";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

if (process.env.ALLOW_DEV_DATABASE_WRITE !== "true") {
  throw new Error("Set ALLOW_DEV_DATABASE_WRITE=true to write the development catalog.");
}
if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const rmitSource = {
  name: "RMIT Vietnam official Bachelor of Computer Science page",
  url: "https://www.rmit.edu.vn/study-at-rmit/undergraduate-programs/bachelor-of-computer-science",
  type: "official_program_page",
  version: "retrieved-live-2026-09-23",
};

async function fetchSource() {
  const response = await fetch(rmitSource.url, {
    headers: {
      "user-agent": "1learn-master-data-import/1.0 (+https://1learn.asia)",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${rmitSource.name} returned HTTP ${response.status}.`);
  const body = Buffer.from(await response.arrayBuffer());
  const text = body.toString("utf8");
  for (const pattern of [
    /Bachelor of Computer Science/i,
    /Program code\s*(?:<[^>]+>\s*)*BP094/i,
    /Study load\s*(?:<[^>]+>\s*)*Full time/i,
    /Software engineering[\s\S]{0,240}Software engineer/i,
    /minimum GPA of 7\.0\/10\.0 for Grade 12/i,
    /minimum score of 6\.0\/10\.0[^]*?Grade 12 mathematics subjects/i,
  ]) {
    if (!pattern.test(text)) throw new Error(`${rmitSource.name} did not contain expected evidence ${pattern}.`);
  }
  return { ...rmitSource, sha256: crypto.createHash("sha256").update(body).digest("hex") };
}

const rmit = await fetchSource();
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  query_timeout: 30_000,
});

try {
  await client.connect();
  await client.query("begin");

  const universityResult = await client.query(
    "select id from public.universities where slug = 'rmit-university-vietnam' for update",
  );
  const majorResult = await client.query("select id from public.majors where code = '7480101' for update");
  const careerResult = await client.query("select id from public.careers where code = 'ONET_15_1252_00' for update");
  if (universityResult.rowCount !== 1 || majorResult.rowCount !== 1 || careerResult.rowCount !== 1) {
    throw new Error("Expected exactly one eligible RMIT, Computer Science major (7480101), and Software Developers career.");
  }

  const universityId = universityResult.rows[0].id;
  const majorId = majorResult.rows[0].id;
  const careerId = careerResult.rows[0].id;
  const existingProgram = await client.query(
    `select id from public.university_majors
     where university_id = $1 and major_id = $2 and program_type = 'full_time'
     for update`,
    [universityId, majorId],
  );
  if (existingProgram.rowCount > 1) {
    throw new Error("Refusing promotion: multiple RMIT Computer Science programme candidates exist.");
  }

  let programId;
  if (existingProgram.rowCount === 1) {
    programId = existingProgram.rows[0].id;
    await client.query(
      `update public.university_majors
       set program_name = 'Bachelor of Computer Science', degree_level = 'undergraduate',
           campus = 'RMIT Saigon South; RMIT Hanoi', status = 'published', source = $2,
           source_url = $3, last_verified_at = now(), verification_status = 'CURATED',
           original_major_code = 'BP094', original_major_name = 'Bachelor of Computer Science',
           mapping_status = 'CURATED'
       where id = $1`,
      [programId, rmit.name, rmit.url],
    );
  } else {
    const insertedProgram = await client.query(
      `insert into public.university_majors (
         university_id, major_id, program_name, degree_level, campus, program_type,
         status, source, source_url, last_verified_at, verification_status,
         original_major_code, original_major_name, mapping_status
       ) values (
         $1, $2, 'Bachelor of Computer Science', 'undergraduate',
         'RMIT Saigon South; RMIT Hanoi', 'full_time', 'published', $3, $4, now(),
         'CURATED', 'BP094', 'Bachelor of Computer Science', 'CURATED'
       ) returning id`,
      [universityId, majorId, rmit.name, rmit.url],
    );
    programId = insertedProgram.rows[0].id;
  }

  const mappingResult = await client.query(
    `insert into public.career_major_mappings (
       career_id, major_id, relationship_type, relevance_score, source, source_url, status, last_verified_at
     ) values ($1, $2, 'primary', 1.00, $3, $4, 'published', now())
     on conflict (career_id, major_id) do update set relationship_type = 'primary', relevance_score = 1.00,
       source = excluded.source, source_url = excluded.source_url, status = 'published', last_verified_at = now()
     returning id`,
    [careerId, majorId, rmit.name, rmit.url],
  );
  const mappingId = mappingResult.rows[0].id;

  const programRun = await client.query(
    `insert into public.master_data_import_runs (
       domain, source_name, source_url, source_version, source_sha256, status,
       input_records, accepted_records, rejected_records, completed_at, notes
     ) values ('university_major', $1, $2, $3, $4, 'completed', 1, 1, 0, now(), $5)
     returning id`,
    [rmit.name, rmit.url, rmit.version, rmit.sha256, "Official RMIT page confirms BP094 Bachelor of Computer Science. Mapping to national major 7480101 is reviewed taxonomy curation."],
  );
  const mappingRun = await client.query(
    `insert into public.master_data_import_runs (
       domain, source_name, source_url, source_version, source_sha256, status,
       input_records, accepted_records, rejected_records, completed_at, notes
     ) values ('career_major_mapping', $1, $2, $3, $4, 'completed', 1, 1, 0, now(), $5)
     returning id`,
    [rmit.name, rmit.url, rmit.version, rmit.sha256, "RMIT official Computer Science career outcomes explicitly list Software engineer, supporting the primary Software Developers to Computer Science relationship."],
  );

  for (const [entityType, entityId, fieldPath, claim, importRunId] of [
    ["university_major", programId, "programme", "RMIT Vietnam's official page identifies BP094 Bachelor of Computer Science as a full-time undergraduate programme at Saigon South and Hanoi.", programRun.rows[0].id],
    ["career_major_mapping", mappingId, "relationship", "RMIT's official Bachelor of Computer Science page lists Software engineer under its Software engineering career outcomes, supporting the primary relationship to the Software Developers occupation.", mappingRun.rows[0].id],
  ]) {
    await client.query(
      `insert into public.master_data_evidence (
         entity_type, entity_id, field_path, source_name, source_url, source_type,
         source_version, source_sha256, claim, review_status, verified_at, import_run_id
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'verified', now(), $10)
       on conflict (entity_type, entity_id, field_path, source_sha256) do update set
         source_name = excluded.source_name, source_url = excluded.source_url, source_type = excluded.source_type,
         source_version = excluded.source_version, claim = excluded.claim, review_status = 'verified',
         verified_at = now(), import_run_id = excluded.import_run_id, updated_at = now()`,
      [entityType, entityId, fieldPath, rmit.name, rmit.url, rmit.type, rmit.version, rmit.sha256, claim, importRunId],
    );
  }

  await client.query("update public.university_majors set is_production_eligible = true where id = $1", [programId]);
  await client.query("update public.career_major_mappings set is_production_eligible = true where id = $1", [mappingId]);
  await client.query("commit");
  console.log(JSON.stringify({ programId, mappingId, sourceSha256: rmit.sha256, importRunIds: { program: programRun.rows[0].id, mapping: mappingRun.rows[0].id } }, null, 2));
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
