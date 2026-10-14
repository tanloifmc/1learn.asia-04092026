import crypto from "node:crypto";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required.");
}

const rmitUrl = "https://www.rmit.edu.vn/study-at-rmit/undergraduate-programs/bachelor-engineering-software-engineering-honours";
const onetUrl = "https://www.onetonline.org/link/summary/15-1252.00";

async function fetchAndValidate(url, requiredPatterns) {
  const response = await fetch(url, {
    headers: { "user-agent": "1learn-master-data-verifier/1.0 (+https://1learn.asia)", accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  const body = Buffer.from(await response.arrayBuffer());
  const text = body.toString("utf8");
  for (const pattern of requiredPatterns) {
    if (!pattern.test(text)) throw new Error(`${url} did not contain expected evidence ${pattern}.`);
  }
  return crypto.createHash("sha256").update(body).digest("hex");
}

const [rmitSha256, onetSha256] = await Promise.all([
  fetchAndValidate(rmitUrl, [
    /Bachelor of Engineering \(Software Engineering\) \(Honours\)/i,
    /Frontend or backend software engineer/i,
    /Full-stack software engineer/i,
  ]),
  fetchAndValidate(onetUrl, [/Software Developers/i, /15-1252\.00/i, /Interest code:\s*(?:<[^>]+>\s*)*IC/i]),
]);

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  const result = await client.query(`
    select
      career.id as career_id,
      career.name as career_name,
      career.name_en as career_name_en,
      career.riasec_profile,
      career.status as career_status,
      career.is_production_eligible as career_eligible,
      program.id as program_id,
      program.program_name,
      program.original_major_code,
      program.mapping_status as program_mapping_status,
      program.status as program_status,
      program.verification_status as program_verification_status,
      program.is_production_eligible as program_eligible,
      mapping.id as mapping_id,
      mapping.relationship_type,
      mapping.relevance_score,
      mapping.status as mapping_status,
      mapping.is_production_eligible as mapping_eligible
    from public.careers as career
    join public.career_major_mappings as mapping on mapping.career_id = career.id
    join public.majors as major on major.id = mapping.major_id
    join public.university_majors as program on program.major_id = major.id
    join public.universities as university on university.id = program.university_id
    where career.code = 'ONET_15_1252_00'
      and major.code = '7480103'
      and university.slug = 'rmit-university-vietnam'
      and program.program_type = 'full_time'
  `);
  if (result.rowCount !== 1) throw new Error(`Expected exactly one verified chain, received ${result.rowCount}.`);
  const chain = result.rows[0];
  const evidence = await client.query(`
    select entity_type, entity_id, field_path, source_url, source_sha256, review_status
    from public.master_data_evidence
    where review_status = 'verified'
      and (
        (entity_type = 'career' and entity_id = $1 and field_path in ('identity', 'riasec_profile') and source_url = $4)
        or (entity_type = 'university_major' and entity_id = $2 and field_path = 'programme' and source_url = $3)
        or (entity_type = 'career_major_mapping' and entity_id = $5 and field_path = 'relationship' and source_url = $3)
      )
  `, [chain.career_id, chain.program_id, rmitUrl, onetUrl, chain.mapping_id]);
  const runs = await client.query(`
    select domain, status, input_records, accepted_records, rejected_records, source_sha256
    from public.master_data_import_runs
    where (domain = 'career' and source_url = $1)
       or (domain in ('university_major', 'career_major_mapping') and source_url = $2)
  `, [onetUrl, rmitUrl]);

  const profile = chain.riasec_profile;
  const checks = {
    career: chain.career_name === "Nhà phát triển phần mềm"
      && chain.career_name_en === "Software Developers"
      && profile?.R === 0
      && profile?.I === 1
      && profile?.A === 0
      && profile?.S === 0
      && profile?.E === 0
      && profile?.C === 1
      && chain.career_status === "published"
      && chain.career_eligible,
    program: chain.program_name === "Bachelor of Engineering (Software Engineering) (Honours)"
      && chain.original_major_code === "BH120"
      && chain.program_mapping_status === "CURATED"
      && chain.program_status === "published"
      && chain.program_verification_status === "CURATED"
      && chain.program_eligible,
    mapping: chain.relationship_type === "primary"
      && Number(chain.relevance_score) === 1
      && chain.mapping_status === "published"
      && chain.mapping_eligible,
    evidence: evidence.rowCount === 4,
    importRuns: ["career", "university_major", "career_major_mapping"].every((domain) => runs.rows.some((run) => (
      run.domain === domain
      && run.status === "completed"
      && run.input_records === 1
      && run.accepted_records === 1
      && run.rejected_records === 0
    ))),
  };
  console.log(JSON.stringify({ rmitSha256, onetSha256, chain, evidence: evidence.rows, importRuns: runs.rows, checks }, null, 2));
  if (!Object.values(checks).every(Boolean)) throw new Error("RMIT Software Engineering chain verification failed.");
} finally {
  await client.end();
}
