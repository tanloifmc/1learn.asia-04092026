import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) throw new Error("SUPABASE_DB_URL is required.");

const rmitUrl = "https://www.rmit.edu.vn/study-at-rmit/undergraduate-programs/bachelor-of-computer-science";

const response = await fetch(rmitUrl, {
  headers: { "user-agent": "1learn-master-data-verifier/1.0 (+https://1learn.asia)", accept: "text/html,application/xhtml+xml" },
  redirect: "follow",
});
if (!response.ok) throw new Error(`RMIT source returned HTTP ${response.status}.`);
const rmitText = Buffer.from(await response.arrayBuffer()).toString("utf8");
for (const pattern of [
  /Bachelor of Computer Science/i,
  /Program code\s*(?:<[^>]+>\s*)*BP094/i,
  /Study load\s*(?:<[^>]+>\s*)*Full time/i,
  /Software engineering[\s\S]{0,240}Software engineer/i,
]) {
  if (!pattern.test(rmitText)) throw new Error(`Live RMIT source is missing expected evidence ${pattern}.`);
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  query_timeout: 10_000,
});

try {
  await client.connect();
  const record = await client.query(`
    select
      program.id as program_id, program.program_name, program.program_type, program.original_major_code,
      program.status as program_status, program.is_production_eligible as program_eligible,
      mapping.id as mapping_id, mapping.relationship_type, mapping.relevance_score,
      mapping.status as mapping_status, mapping.is_production_eligible as mapping_eligible,
      career.code as career_code, career.is_production_eligible as career_eligible,
      count(evidence.id) filter (where evidence.entity_type = 'university_major' and evidence.field_path = 'programme' and evidence.review_status = 'verified')::int as programme_evidence,
      count(evidence.id) filter (where evidence.entity_type = 'career_major_mapping' and evidence.field_path = 'relationship' and evidence.review_status = 'verified')::int as relationship_evidence
    from public.university_majors program
    join public.universities university on university.id = program.university_id
    join public.majors major on major.id = program.major_id
    join public.career_major_mappings mapping on mapping.major_id = major.id
    join public.careers career on career.id = mapping.career_id
    left join public.master_data_evidence evidence on evidence.entity_id in (program.id, mapping.id)
    where university.slug = 'rmit-university-vietnam'
      and major.code = '7480101'
      and program.program_type = 'full_time'
      and career.code = 'ONET_15_1252_00'
    group by program.id, mapping.id, career.code, career.is_production_eligible
  `);
  if (record.rowCount !== 1) throw new Error(`Expected one RMIT Computer Science chain; found ${record.rowCount}.`);
  const row = record.rows[0];
  const checks = {
    program: row.program_name === "Bachelor of Computer Science" && row.program_type === "full_time" && row.original_major_code === "BP094" && row.program_status === "published" && row.program_eligible,
    mapping: row.relationship_type === "primary" && Number(row.relevance_score) === 1 && row.mapping_status === "published" && row.mapping_eligible,
    career: row.career_code === "ONET_15_1252_00" && row.career_eligible,
    evidence: row.programme_evidence >= 1 && row.relationship_evidence >= 1,
  };
  const passed = Object.values(checks).every(Boolean);
  console.log(JSON.stringify({ passed, checks, identifiers: { programId: row.program_id, mappingId: row.mapping_id } }, null, 2));
  if (!passed) process.exitCode = 1;
} finally {
  await client.end();
}
