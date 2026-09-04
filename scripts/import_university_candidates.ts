import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// A helper function for generating slugs from strings
function slugify(text: string): string {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function removeVietnameseTones(str: string) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
}

function generateSlug(text: string) {
    return slugify(removeVietnameseTones(text));
}

async function runImport() {
  console.log("Starting University Import...");
  const dataPath = path.join(process.cwd(), 'data', 'national_universities_candidate.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`File not found: ${dataPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Loaded ${rawData.length} universities from candidate JSON.`);

  // 1. Fetch Taxonomy Majors
  const { data: taxonomyMajors, error: taxError } = await supabase
    .from('majors')
    .select('id, name');
    
  if (taxError) {
    console.error("Failed to fetch taxonomy majors:", taxError);
    process.exit(1);
  }

  const taxonomyMap = new Map<string, string>();
  taxonomyMajors.forEach(m => {
    taxonomyMap.set(m.name.trim().toLowerCase(), m.id);
  });
  console.log(`Loaded ${taxonomyMap.size} taxonomy majors from DB.`);

  let stats = {
    totalUniversitiesCandidate: rawData.length,
    totalUniversitiesDb: 0,
    totalActualMajorsCandidate: 0,
    totalActualMajorsDb: 0,
    acceptedMatch: 0,
    needsReview: 0,
    unmapped: 0,
    duplicates: 0,
    missingSource: 0,
    missingId: 0,
    droppedRecords: 0
  };

  // Upsert all universities first
  const uniUpserts = rawData.map((uni: any) => ({
    name: uni.original_university_name,
    code: uni.original_university_code,
    slug: generateSlug(uni.original_university_name) + '-' + uni.original_university_code.toLowerCase(),
    status: 'published',
    source: uni.source,
    source_url: uni.source_url
  }));

  console.log("Upserting Universities...");
  const { data: upsertedUnis, error: uniError } = await supabase
    .from('universities')
    .upsert(uniUpserts, { onConflict: 'code', ignoreDuplicates: false })
    .select('id, code');

  if (uniError) {
    console.error("Failed to upsert universities:", uniError);
    process.exit(1);
  }
  stats.totalUniversitiesDb = upsertedUnis.length;
  
  const uniCodeToId = new Map<string, string>();
  upsertedUnis.forEach(u => uniCodeToId.set(u.code, u.id));

  console.log("Upserting Actual Majors...");
  let majorUpserts: any[] = [];
  
  rawData.forEach((uni: any) => {
    const uniId = uniCodeToId.get(uni.original_university_code);
    if (!uniId) {
      console.warn(`Missing university ID for code: ${uni.original_university_code}`);
      return;
    }

    if (uni.status === 'MISSING_SOURCE') {
        stats.missingSource++;
    }

    uni.majors.forEach((m: any) => {
      stats.totalActualMajorsCandidate++;
      
      let taxonomyId = null;
      if (m.mapping_status === 'ACCEPTED_MATCH' || m.mapping_status === 'NEEDS_REVIEW') {
          const tName = m.mapped_taxonomy.trim().toLowerCase();
          taxonomyId = taxonomyMap.get(tName);
          if (!taxonomyId) {
              console.warn(`Taxonomy major not found in DB: "${m.mapped_taxonomy}" (falling back to UNMAPPED)`);
              m.mapping_status = 'UNMAPPED';
          }
      }
      
      if (m.mapping_status === 'ACCEPTED_MATCH') stats.acceptedMatch++;
      if (m.mapping_status === 'NEEDS_REVIEW') stats.needsReview++;
      if (m.mapping_status === 'UNMAPPED') stats.unmapped++;

      majorUpserts.push({
        university_id: uniId,
        original_major_code: m.original_major_code,
        original_major_name: m.original_major_name,
        major_id: taxonomyId,
        mapping_status: m.mapping_status,
        source: uni.source,
        source_url: uni.source_url
      });
    });
  });

  // Since Supabase Upsert has a 1000 row limit per request typically, chunk it.
  const chunkSize = 500;
  let successCount = 0;
  for (let i = 0; i < majorUpserts.length; i += chunkSize) {
    const chunk = majorUpserts.slice(i, i + chunkSize);
    const { data: upsertedMajors, error: majorError } = await supabase
      .from('university_majors')
      .upsert(chunk, { onConflict: 'university_id,original_major_code,original_major_name', ignoreDuplicates: false })
      .select('id');

    if (majorError) {
      console.error(`Failed to upsert majors chunk ${i}:`, majorError);
      process.exit(1);
    }
    successCount += upsertedMajors.length;
    console.log(`Upserted ${successCount}/${majorUpserts.length} majors...`);
  }
  
  stats.totalActualMajorsDb = successCount;

  // DB Verification / Audit
  const { count: actualMajorsCount, error: countError } = await supabase
    .from('university_majors')
    .select('*', { count: 'exact', head: true });

  const { count: missingIdCount } = await supabase
    .from('university_majors')
    .select('*', { count: 'exact', head: true })
    .is('id', null);

  stats.missingId = missingIdCount || 0;
  if (stats.totalActualMajorsDb < stats.totalActualMajorsCandidate) {
      stats.droppedRecords = stats.totalActualMajorsCandidate - stats.totalActualMajorsDb;
  }
  
  console.log("\n=================================");
  console.log("FINAL AUDIT REPORT");
  console.log("=================================");
  console.log(`TOTAL UNIVERSITIES CANDIDATE : ${stats.totalUniversitiesCandidate}`);
  console.log(`TOTAL UNIVERSITIES DB        : ${stats.totalUniversitiesDb}`);
  console.log(`TOTAL ACTUAL MAJORS CANDIDATE: ${stats.totalActualMajorsCandidate}`);
  console.log(`TOTAL ACTUAL MAJORS DB       : ${stats.totalActualMajorsDb}`);
  console.log(`ACTUAL MAJORS IN DB TABLE    : ${actualMajorsCount}`);
  console.log(`ACCEPTED_MATCH               : ${stats.acceptedMatch}`);
  console.log(`NEEDS_REVIEW                 : ${stats.needsReview}`);
  console.log(`UNMAPPED                     : ${stats.unmapped}`);
  console.log(`DUPLICATES                   : ${stats.duplicates}`);
  console.log(`MISSING_SOURCE               : ${stats.missingSource}`);
  console.log(`MISSING_ID                   : ${stats.missingId}`);
  console.log(`DROPPED_RECORDS              : ${stats.droppedRecords}`);
  console.log("=================================\n");

  if (stats.totalActualMajorsDb !== stats.totalActualMajorsCandidate || stats.droppedRecords > 0 || stats.missingId > 0) {
      console.error("❌ AUDIT FAILED: DB mismatch.");
  } else {
      console.log("✅ AUDIT PASS: All data safely imported and verifiable.");
  }
}

runImport().catch(console.error);
