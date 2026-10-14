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

const sourceUrl = "https://www.rmit.edu.vn/study-at-rmit/undergraduate-programs/bachelor-business";
const sourceName = "RMIT Vietnam official Bachelor of Business page";

const sourceResponse = await fetch(sourceUrl, {
  headers: {
    "user-agent": "1learn-master-data-verifier/1.0 (+https://1learn.asia)",
    accept: "text/html,application/xhtml+xml",
  },
  redirect: "follow",
});
if (!sourceResponse.ok) {
  throw new Error(`Official RMIT source returned HTTP ${sourceResponse.status}.`);
}

const sourceBody = Buffer.from(await sourceResponse.arrayBuffer());
const sourceText = sourceBody.toString("utf8");
if (!/Bachelor of Business/i.test(sourceText) || !/RMIT/i.test(sourceText)) {
  throw new Error("Official RMIT response did not contain the expected programme identity.");
}

const sourceSha256 = crypto.createHash("sha256").update(sourceBody).digest("hex");
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query("BEGIN");

  const programResult = await client.query(`
    select program.id as program_id, university.id as university_id, major.id as major_id
    from public.university_majors program
    join public.universities university on university.id = program.university_id
    join public.majors major on major.id = program.major_id
    where university.slug = 'rmit-university-vietnam'
      and major.slug = 'cu-nhan-kinh-doanh-rmit'
    for update of program, university, major
  `);
  if (programResult.rowCount !== 1) {
    throw new Error("Expected exactly one RMIT Bachelor of Business programme record.");
  }
  const { program_id: programId, university_id: universityId, major_id: majorId } = programResult.rows[0];

  const importRun = await client.query(`
    insert into public.master_data_import_runs (
      domain, source_name, source_url, source_version, source_sha256,
      status, input_records, accepted_records, rejected_records, completed_at, notes
    ) values (
      'university_major', $1, $2, 'retrieved-live', $3,
      'completed', 3, 3, 0, now(),
      'Re-verified RMIT university, Bachelor of Business major, and programme availability from one official source.'
    ) returning id
  `, [sourceName, sourceUrl, sourceSha256]);
  const importRunId = importRun.rows[0].id;

  const evidence = [
    ["university", universityId, "identity", "Official RMIT Vietnam page identifies RMIT as the provider of the Bachelor of Business programme."],
    ["major", majorId, "identity", "Official RMIT Vietnam page identifies the Bachelor of Business programme."],
    ["university_major", programId, "programme", "Official RMIT Vietnam page confirms that RMIT Vietnam offers Bachelor of Business."],
  ];
  for (const [entityType, entityId, fieldPath, claim] of evidence) {
    await client.query(`
      insert into public.master_data_evidence (
        entity_type, entity_id, field_path, source_name, source_url, source_type,
        source_version, source_sha256, claim, review_status, verified_at, import_run_id
      ) values ($1, $2, $3, $4, $5, 'official_program_page', 'retrieved-live', $6, $7, 'verified', now(), $8)
      on conflict (entity_type, entity_id, field_path, source_sha256)
      do update set review_status = 'verified', verified_at = excluded.verified_at,
        import_run_id = excluded.import_run_id, updated_at = now()
    `, [entityType, entityId, fieldPath, sourceName, sourceUrl, sourceSha256, claim, importRunId]);
  }

  await client.query(`
    update public.universities
    set last_verified_at = now(), is_production_eligible = true
    where id = $1
  `, [universityId]);
  await client.query(`
    update public.majors
    set last_verified_at = now(), is_production_eligible = true
    where id = $1
  `, [majorId]);
  await client.query(`
    update public.university_majors
    set last_verified_at = now(), is_production_eligible = true
    where id = $1
  `, [programId]);

  await client.query("COMMIT");
  console.log(JSON.stringify({
    sourceUrl,
    sourceSha256,
    importRunId,
    verifiedEntities: {
      universityId,
      majorId,
      programId,
    },
  }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
