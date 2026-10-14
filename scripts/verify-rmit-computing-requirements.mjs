import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

if (!process.env.SUPABASE_DB_URL) throw new Error("SUPABASE_DB_URL is required.");

const sources = [
  {
    majorCode: "7480103",
    programName: "Bachelor of Engineering (Software Engineering) (Honours)",
    url: "https://www.rmit.edu.vn/study-at-rmit/undergraduate-programs/bachelor-engineering-software-engineering-honours",
  },
  {
    majorCode: "7480101",
    programName: "Bachelor of Computer Science",
    url: "https://www.rmit.edu.vn/study-at-rmit/undergraduate-programs/bachelor-of-computer-science",
  },
];

async function verifyLiveSource(source) {
  const response = await fetch(source.url, {
    headers: { "user-agent": "1learn-master-data-verifier/1.0 (+https://1learn.asia)", accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${source.url} returned HTTP ${response.status}.`);
  const body = Buffer.from(await response.arrayBuffer());
  const text = body.toString("utf8");
  for (const pattern of [
    new RegExp(source.programName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    /Achieve a minimum GPA of 7\.0\/10\.0 for Grade 12/i,
    /A minimum score of 6\.0\/10\.0[^]*?Grade 12 mathematics subjects/i,
  ]) {
    if (!pattern.test(text)) throw new Error(`${source.url} is missing evidence ${pattern}.`);
  }
  return true;
}

await Promise.all(sources.map(verifyLiveSource));
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  query_timeout: 10_000,
});

try {
  await client.connect();
  const verifiedPrograms = [];
  for (const source of sources) {
    const requirements = await client.query(
      `select requirement.requirement_code, requirement.requirement_type, requirement.comparison_operator, requirement.requirement_value, requirement.unit,
              requirement.importance, requirement.satisfaction_group, requirement.status, requirement.is_production_eligible,
              requirement.source_url, requirement.last_verified_at
       from public.target_requirements requirement
       join public.university_majors program on program.id = requirement.target_id
       join public.universities university on university.id = program.university_id
       join public.majors major on major.id = program.major_id
       where requirement.target_type = 'university_major'
         and university.slug = 'rmit-university-vietnam'
         and major.code = $1
         and program.program_name = $2
         and requirement.requirement_code in ('academic_gpa_grade12', 'academic_math_grade12')
       order by requirement.requirement_code`,
      [source.majorCode, source.programName],
    );
    const byCode = new Map(requirements.rows.map((row) => [row.requirement_code, row]));
    const gpa = byCode.get("academic_gpa_grade12");
    const math = byCode.get("academic_math_grade12");
    const run = await client.query(
      `select id from public.master_data_import_runs
       where domain = 'target_requirement' and source_url = $1
         and source_sha256 ~ '^[a-f0-9]{64}$'
         and status = 'completed' and input_records = 2 and accepted_records = 2 and rejected_records = 0`,
      [source.url],
    );
    const checks = {
      gpa: gpa?.requirement_type === "academic" && gpa?.comparison_operator === ">=" && gpa?.requirement_value === "7.0" && gpa?.unit === "score_10" && gpa?.importance === "high",
      math: math?.requirement_type === "academic" && math?.comparison_operator === ">=" && math?.requirement_value === "6.0" && math?.unit === "score_10" && math?.importance === "critical",
      provenance: [gpa, math].every((requirement) => requirement?.status === "published" && requirement?.is_production_eligible && requirement?.source_url === source.url && requirement?.last_verified_at && requirement?.satisfaction_group === null),
      importRun: run.rowCount >= 1,
    };
    verifiedPrograms.push({ majorCode: source.majorCode, checks, passed: Object.values(checks).every(Boolean) });
  }
  const passed = verifiedPrograms.every((program) => program.passed);
  console.log(JSON.stringify({ passed, verifiedPrograms }, null, 2));
  if (!passed) process.exitCode = 1;
} finally {
  await client.end();
}
