// @ts-ignore
// ⛔ SCRIPT DISABLED BY CTO DIRECTIVE (2026-08-30)
// Actual Majors ≠ Taxonomy Majors. DO NOT PROMOTE ACTUAL MAJORS TO TAXONOMY.
// Running this script will corrupt the data model.
// See DATA_INTEGRITY_AUDIT.md for context.
console.error("⛔ SCRIPT DISABLED: promote_all_majors_to_official is permanently disabled.");
console.error("   Per CTO Directive: Actual Major ≠ Taxonomy Major.");
console.error("   Do NOT run this script. Edit AGENTS.md if you disagree.");
process.exit(1);

// @ts-ignore -- Original code below is kept for reference ONLY, will never execute
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const pool = new Pool({
  connectionString: process.env.DIRECT_URL
});

function slugify(text: string): string {
  return text.toString().toLowerCase()
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
    .replace(/ì|í|ị|ỉ|ĩ/g, "i")
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
    .replace(/đ/g, "d")
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function run() {
  console.log("Promoting ALL remaining unmapped real-world majors to OFFICIAL MAJORS...");

  // 1. Fetch all unique UNMAPPED majors directly via SQL to avoid 1000 limit
  const { rows: unmapped } = await pool.query(
    "SELECT id, original_major_code, original_major_name FROM university_majors WHERE major_id IS NULL"
  );

  console.log(`Found ${unmapped.length} unmapped programs.`);

  if (unmapped.length === 0) {
      console.log("Nothing to do.");
      await pool.end();
      return;
  }

  // Group by unique name to avoid duplicate insertions into `majors`
  const uniqueMajorsMap = new Map<string, any>();
  
  for (const prog of unmapped) {
    const key = prog.original_major_name.trim().toLowerCase();
    if (!uniqueMajorsMap.has(key)) {
      uniqueMajorsMap.set(key, {
        name: prog.original_major_name.trim(),
        code: prog.original_major_code,
        slug: slugify(prog.original_major_name.trim()),
        field: "Chưa phân loại",
        status: "published"
      });
    }
  }

  const uniqueMajors = Array.from(uniqueMajorsMap.values());
  console.log(`Identified ${uniqueMajors.length} UNIQUE official majors to create.`);

  // 2. Insert into `majors` in chunks
  const chunkSize = 500;
  let insertedMajors: any[] = [];
  
  for (let i = 0; i < uniqueMajors.length; i += chunkSize) {
    const chunk = uniqueMajors.slice(i, i + chunkSize);
    
    // To prevent slug conflict within the chunk itself or DB:
    for (const m of chunk) {
        m.slug = m.slug + '-' + Math.floor(Math.random() * 1000000);
    }

    const { data: inserted, error: insertError } = await supabase
      .from('majors')
      .insert(chunk)
      .select('id, name');

    if (insertError) {
      console.error(`Error inserting chunk ${i}:`, insertError);
      await pool.end();
      return;
    }
    insertedMajors = insertedMajors.concat(inserted);
    console.log(`Inserted ${insertedMajors.length}/${uniqueMajors.length} official majors...`);
  }

  // Create a mapping from name -> new major_id
  const nameToId = new Map<string, string>();
  insertedMajors.forEach(m => nameToId.set(m.name.trim().toLowerCase(), m.id));

  // 3. Update university_majors to link to these new official majors
  console.log("Linking university_majors to the new official majors...");
  
  // Use raw SQL to bulk update for speed and avoiding limits
  let updatedCount = 0;
  for (const prog of unmapped) {
    const key = prog.original_major_name.trim().toLowerCase();
    const newMajorId = nameToId.get(key);

    if (newMajorId) {
        await pool.query(
            "UPDATE university_majors SET major_id = $1, mapping_status = 'ACCEPTED_MATCH' WHERE id = $2",
            [newMajorId, prog.id]
        );
        updatedCount++;
        if (updatedCount % 500 === 0) {
            console.log(`Updated ${updatedCount}/${unmapped.length} links...`);
        }
    }
  }
  
  console.log(`Updated ${updatedCount}/${unmapped.length} links...`);
  console.log("✅ ALL REMAINING MAJORS ARE NOW OFFICIAL AND FULLY LINKED!");
  
  await pool.end();
}

run().catch(console.error);
