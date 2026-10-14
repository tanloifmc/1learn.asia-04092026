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
  name: "RMIT Vietnam official Bachelor of Engineering (Software Engineering) (Honours) page",
  url: "https://www.rmit.edu.vn/study-at-rmit/undergraduate-programs/bachelor-engineering-software-engineering-honours",
  type: "official_program_page",
  version: "retrieved-live-2026-09-23",
};
const onetSource = {
  name: "O*NET OnLine — Software Developers (15-1252.00)",
  url: "https://www.onetonline.org/link/summary/15-1252.00",
  type: "official_government_occupation_taxonomy",
  version: "O*NET-OnLine-2026",
};
const careerIdentity = {
  code: "ONET_15_1252_00",
  slug: "nha-phat-trien-phan-mem-onet-15-1252-00",
  name: "Nhà phát triển phần mềm",
  nameEn: "Software Developers",
  riasecProfile: { R: 0, I: 1, A: 0, S: 0, E: 0, C: 1 },
};

async function fetchSource(source, requiredPatterns) {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": "1learn-master-data-verifier/1.0 (+https://1learn.asia)",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`${source.name} returned HTTP ${response.status}.`);
  }
  const body = Buffer.from(await response.arrayBuffer());
  const text = body.toString("utf8");
  for (const pattern of requiredPatterns) {
    if (!pattern.test(text)) {
      throw new Error(`${source.name} did not contain expected evidence ${pattern}.`);
    }
  }
  return { ...source, sha256: crypto.createHash("sha256").update(body).digest("hex") };
}

const [rmit, onet] = await Promise.all([
  fetchSource(rmitSource, [
    /Bachelor of Engineering \(Software Engineering\) \(Honours\)/i,
    /RMIT Vietnam/i,
    /Frontend or backend software engineer/i,
    /Full-stack software engineer/i,
  ]),
  fetchSource(onetSource, [
    /Software Developers/i,
    /15-1252\.00/i,
    /Interest code:\s*(?:<[^>]+>\s*)*IC/i,
  ]),
]);

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query("BEGIN");

  const [universityResult, majorResult] = await Promise.all([
    client.query(`select id from public.universities where slug = 'rmit-university-vietnam' for update`),
    client.query(`select id from public.majors where code = '7480103' for update`),
  ]);
  if (universityResult.rowCount !== 1 || majorResult.rowCount !== 1) {
    throw new Error("Expected exactly one RMIT University Vietnam and one national Software Engineering major (7480103).");
  }
  const universityId = universityResult.rows[0].id;
  const majorId = majorResult.rows[0].id;

  const careerResult = await client.query(`
    insert into public.careers (
      code, name, name_en, slug, career_domain_code, riasec_profile,
      status, source, source_url, source_type, published_at, last_verified_at
    ) values ($1, $2, $3, $4, 'IT', $5::jsonb, 'published', $6, $7, 'official', now(), now())
    on conflict (code) do update set
      name = excluded.name,
      name_en = excluded.name_en,
      slug = excluded.slug,
      career_domain_code = excluded.career_domain_code,
      riasec_profile = excluded.riasec_profile,
      status = 'published',
      source = excluded.source,
      source_url = excluded.source_url,
      source_type = 'official',
      last_verified_at = now()
    returning id
  `, [
    careerIdentity.code,
    careerIdentity.name,
    careerIdentity.nameEn,
    careerIdentity.slug,
    JSON.stringify(careerIdentity.riasecProfile),
    onet.name,
    onet.url,
  ]);
  const careerId = careerResult.rows[0].id;

  const existingProgram = await client.query(`
    select id
    from public.university_majors
    where university_id = $1 and major_id = $2 and program_type = 'full_time'
    for update
  `, [universityId, majorId]);
  if (existingProgram.rowCount > 1) {
    throw new Error("Refusing promotion: multiple RMIT Software Engineering programme candidates exist.");
  }
  let programId;
  if (existingProgram.rowCount === 1) {
    programId = existingProgram.rows[0].id;
    await client.query(`
      update public.university_majors
      set program_name = 'Bachelor of Engineering (Software Engineering) (Honours)',
          degree_level = 'undergraduate',
          campus = 'RMIT Saigon South; RMIT Hanoi',
          status = 'published',
          source = $2,
          source_url = $3,
          last_verified_at = now(),
          verification_status = 'CURATED',
          original_major_code = 'BH120',
          original_major_name = 'Bachelor of Engineering (Software Engineering) (Honours)',
          mapping_status = 'CURATED'
      where id = $1
    `, [programId, rmit.name, rmit.url]);
  } else {
    const programResult = await client.query(`
      insert into public.university_majors (
        university_id, major_id, program_name, degree_level, campus, program_type,
        status, source, source_url, last_verified_at, verification_status,
        original_major_code, original_major_name, mapping_status
      ) values (
        $1, $2, 'Bachelor of Engineering (Software Engineering) (Honours)', 'undergraduate',
        'RMIT Saigon South; RMIT Hanoi', 'full_time',
        'published', $3, $4, now(), 'CURATED',
        'BH120', 'Bachelor of Engineering (Software Engineering) (Honours)', 'CURATED'
      ) returning id
    `, [universityId, majorId, rmit.name, rmit.url]);
    programId = programResult.rows[0].id;
  }

  const mappingResult = await client.query(`
    insert into public.career_major_mappings (
      career_id, major_id, relationship_type, relevance_score,
      source, source_url, status, last_verified_at
    ) values ($1, $2, 'primary', 1.00, $3, $4, 'published', now())
    on conflict (career_id, major_id) do update set
      relationship_type = 'primary',
      relevance_score = 1.00,
      source = excluded.source,
      source_url = excluded.source_url,
      status = 'published',
      last_verified_at = now()
    returning id
  `, [careerId, majorId, rmit.name, rmit.url]);
  const mappingId = mappingResult.rows[0].id;

  const careerRun = await client.query(`
    insert into public.master_data_import_runs (
      domain, source_name, source_url, source_version, source_sha256,
      status, input_records, accepted_records, rejected_records, completed_at, notes
    ) values ('career', $1, $2, $3, $4, 'completed', 1, 1, 0, now(), $5)
    returning id
  `, [onet.name, onet.url, onet.version, onet.sha256, "O*NET 15-1252.00 identity plus binary RIASEC storage: only source-declared I and C dimensions are 1; all undeclared dimensions are 0."]);
  const programRun = await client.query(`
    insert into public.master_data_import_runs (
      domain, source_name, source_url, source_version, source_sha256,
      status, input_records, accepted_records, rejected_records, completed_at, notes
    ) values ('university_major', $1, $2, $3, $4, 'completed', 1, 1, 0, now(), $5)
    returning id
  `, [rmit.name, rmit.url, rmit.version, rmit.sha256, "Official RMIT page confirms BH120 programme. Mapping to national major 7480103 is a reviewed English/Vietnamese taxonomy curation, retained in original_major_name and mapping_status."]);
  const mappingRun = await client.query(`
    insert into public.master_data_import_runs (
      domain, source_name, source_url, source_version, source_sha256,
      status, input_records, accepted_records, rejected_records, completed_at, notes
    ) values ('career_major_mapping', $1, $2, $3, $4, 'completed', 1, 1, 0, now(), $5)
    returning id
  `, [rmit.name, rmit.url, rmit.version, rmit.sha256, "Official RMIT outcome lists frontend/backend, full-stack, mobile, and embedded software-engineer careers for this software engineering programme."]);

  const evidence = [
    ["career", careerId, "identity", onet, "O*NET occupation 15-1252.00 is Software Developers; the Vietnamese record is a reviewed translation of that title.", careerRun.rows[0].id],
    ["career", careerId, "riasec_profile", onet, "O*NET 15-1252.00 reports Interest code IC. The stored profile is a binary encoding of the two explicitly declared dimensions: I=1, C=1; R=A=S=E=0.", careerRun.rows[0].id],
    ["university_major", programId, "programme", rmit, "RMIT Vietnam's official page identifies BH120, Bachelor of Engineering (Software Engineering) (Honours), as a full-time undergraduate programme at Saigon South and Hanoi.", programRun.rows[0].id],
    ["career_major_mapping", mappingId, "relationship", rmit, "RMIT's official programme page lists frontend/backend, full-stack, mobile, and embedded software-engineer careers, supporting the primary relationship between Software Developers and Software Engineering.", mappingRun.rows[0].id],
  ];
  for (const [entityType, entityId, fieldPath, source, claim, importRunId] of evidence) {
    await client.query(`
      insert into public.master_data_evidence (
        entity_type, entity_id, field_path, source_name, source_url, source_type,
        source_version, source_sha256, claim, review_status, verified_at, import_run_id
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'verified', now(), $10)
      on conflict (entity_type, entity_id, field_path, source_sha256) do update set
        source_name = excluded.source_name,
        source_url = excluded.source_url,
        source_type = excluded.source_type,
        source_version = excluded.source_version,
        claim = excluded.claim,
        review_status = 'verified',
        verified_at = now(),
        import_run_id = excluded.import_run_id,
        updated_at = now()
    `, [entityType, entityId, fieldPath, source.name, source.url, source.type, source.version, source.sha256, claim, importRunId]);
  }

  await client.query(`update public.careers set is_production_eligible = true where id = $1`, [careerId]);
  await client.query(`update public.university_majors set is_production_eligible = true where id = $1`, [programId]);
  await client.query(`update public.career_major_mappings set is_production_eligible = true where id = $1`, [mappingId]);
  await client.query("COMMIT");

  console.log(JSON.stringify({
    rmitSourceSha256: rmit.sha256,
    onetSourceSha256: onet.sha256,
    careerId,
    programId,
    mappingId,
    importRunIds: {
      career: careerRun.rows[0].id,
      universityMajor: programRun.rows[0].id,
      careerMajorMapping: mappingRun.rows[0].id,
    },
  }, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
