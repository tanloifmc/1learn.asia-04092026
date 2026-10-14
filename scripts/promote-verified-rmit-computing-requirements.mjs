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

const sources = [
  {
    majorCode: "7480103",
    programName: "Bachelor of Engineering (Software Engineering) (Honours)",
    sourceName: "RMIT Vietnam official Bachelor of Engineering (Software Engineering) (Honours) page",
    url: "https://www.rmit.edu.vn/study-at-rmit/undergraduate-programs/bachelor-engineering-software-engineering-honours",
  },
  {
    majorCode: "7480101",
    programName: "Bachelor of Computer Science",
    sourceName: "RMIT Vietnam official Bachelor of Computer Science page",
    url: "https://www.rmit.edu.vn/study-at-rmit/undergraduate-programs/bachelor-of-computer-science",
  },
];

async function fetchAndValidate(source) {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": "1learn-master-data-import/1.0 (+https://1learn.asia)",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${source.sourceName} returned HTTP ${response.status}.`);
  const body = Buffer.from(await response.arrayBuffer());
  const text = body.toString("utf8");
  for (const pattern of [
    new RegExp(source.programName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    /Achieve a minimum GPA of 7\.0\/10\.0 for Grade 12/i,
    /A minimum score of 6\.0\/10\.0[^]*?Grade 12 mathematics subjects/i,
  ]) {
    if (!pattern.test(text)) throw new Error(`${source.sourceName} did not contain expected admission evidence ${pattern}.`);
  }
  return { ...source, sha256: crypto.createHash("sha256").update(body).digest("hex") };
}

const verifiedSources = await Promise.all(sources.map(fetchAndValidate));
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  query_timeout: 30_000,
});

async function upsertRequirement(programId, source, requirement) {
  const existing = await client.query(
    `select id from public.target_requirements
     where target_type = 'university_major' and target_id = $1 and requirement_code = $2
     for update`,
    [programId, requirement.code],
  );
  if (existing.rowCount > 1) {
    throw new Error(`Refusing promotion: duplicate ${requirement.code} requirements for program ${programId}.`);
  }
  const values = [
    programId,
    requirement.code,
    requirement.type,
    requirement.operator,
    requirement.value,
    requirement.unit,
    requirement.importance,
    source.sourceName,
    source.url,
  ];
  if (existing.rowCount === 1) {
    await client.query(
      `update public.target_requirements
       set requirement_type = $3, comparison_operator = $4, requirement_value = $5, unit = $6,
           importance = $7, satisfaction_group = null, status = 'published', source = $8,
           source_url = $9, last_verified_at = now(), is_production_eligible = true
       where id = $10`,
      [...values, existing.rows[0].id],
    );
    return existing.rows[0].id;
  }
  const inserted = await client.query(
    `insert into public.target_requirements (
       target_type, target_id, requirement_code, requirement_type, comparison_operator,
       requirement_value, unit, importance, satisfaction_group, status, source, source_url,
       last_verified_at, is_production_eligible
     ) values (
       'university_major', $1, $2, $3, $4, $5, $6, $7, null, 'published', $8, $9, now(), true
     ) returning id`,
    values,
  );
  return inserted.rows[0].id;
}

try {
  await client.connect();
  await client.query("begin");
  const university = await client.query(
    "select id from public.universities where slug = 'rmit-university-vietnam' and is_production_eligible for update",
  );
  if (university.rowCount !== 1) throw new Error("Expected one eligible RMIT University Vietnam record.");

  const result = [];
  for (const source of verifiedSources) {
    const program = await client.query(
      `select program.id
       from public.university_majors program
       join public.majors major on major.id = program.major_id
       where program.university_id = $1 and major.code = $2 and program.program_type = 'full_time'
         and program.program_name = $3 and program.is_production_eligible
       for update`,
      [university.rows[0].id, source.majorCode, source.programName],
    );
    if (program.rowCount !== 1) throw new Error(`Expected one eligible ${source.programName} program.`);
    const programId = program.rows[0].id;
    const requirementIds = [];
    for (const requirement of [
      { code: "academic_gpa_grade12", type: "academic", operator: ">=", value: "7.0", unit: "score_10", importance: "high" },
      { code: "academic_math_grade12", type: "academic", operator: ">=", value: "6.0", unit: "score_10", importance: "critical" },
    ]) {
      requirementIds.push(await upsertRequirement(programId, source, requirement));
    }
    const importRun = await client.query(
      `insert into public.master_data_import_runs (
         domain, source_name, source_url, source_version, source_sha256, status,
         input_records, accepted_records, rejected_records, completed_at, notes
       ) values ('target_requirement', $1, $2, 'retrieved-live-2026-09-23', $3, 'completed', 2, 2, 0, now(), $4)
       returning id`,
      [source.sourceName, source.url, source.sha256, "Official RMIT admission requirements: Grade 12 GPA >= 7.0/10.0 and Grade 12 mathematics >= 6.0/10.0."],
    );
    result.push({ programId, requirementIds, importRunId: importRun.rows[0].id, sourceSha256: source.sha256 });
  }
  await client.query("commit");
  console.log(JSON.stringify({ programs: result }, null, 2));
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
