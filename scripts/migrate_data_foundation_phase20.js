const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  console.error("DIRECT_URL not found");
  process.exit(1);
}

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Better slugify for Vietnamese
function vnSlugify(text) {
  let str = text.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
  str = str.replace(/ + /g, " ");
  str = str.trim();
  str = str.replace(/\s+/g, "-");
  return str;
}

const pool = new Pool({
  connectionString,
});

async function runMigration() {
  console.log("Parsing majors from thông tin ngành.txt...");
  const txt = fs.readFileSync('thông tin ngành.txt', 'utf8');
  const lines = txt.split('\n');
  const majors = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^7\d{6}\r?$/)) {
      const code = lines[i].trim();
      const name = lines[i+2].trim();
      majors.push({ code, name });
    }
  }
  console.log(`Found ${majors.length} bachelor majors.`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Snapshot / Checkpoint
    console.log("Running Checkpoints...");
    const uMajorsCount = await client.query('SELECT count(*) FROM university_majors;');
    console.log(`university_majors count: ${uMajorsCount.rows[0].count}`);

    // 2. Detach dependencies
    console.log("Detaching foreign keys safely...");
    await client.query('UPDATE roadmaps SET target_major_id = NULL WHERE target_major_id IS NOT NULL;');
    await client.query('UPDATE student_goals SET major_id = NULL WHERE major_id IS NOT NULL;');
    await client.query('UPDATE university_majors SET major_id = NULL;');

    // 3. Replace majors
    console.log("Deleting mock majors...");
    await client.query('DELETE FROM majors;');

    console.log("Inserting 377 Master majors...");
    for (const major of majors) {
      let slug = vnSlugify(major.name) + '-' + major.code;
      await client.query(
        `INSERT INTO majors (code, name, slug, field, status) VALUES ($1, $2, $3, $4, $5)`,
        [major.code, major.name, slug, 'Chưa phân loại', 'published']
      );
    }

    // 4. Reconcile
    console.log("Reconciling EXACT_CODE...");
    await client.query(`
      UPDATE university_majors um
      SET major_id = m.id, mapping_status = 'MATCHED_CODE'
      FROM majors m
      WHERE um.original_major_code = m.code;
    `);

    console.log("Reconciling NAME_EXACT...");
    await client.query(`
      UPDATE university_majors um
      SET major_id = m.id, mapping_status = 'MATCHED_NAME'
      FROM majors m
      WHERE um.major_id IS NULL AND LOWER(um.original_major_name) = LOWER(m.name);
    `);

    // 5. Verify
    console.log("Verification step...");
    const verifyMajors = await client.query('SELECT count(*) FROM majors;');
    console.log(`New majors count: ${verifyMajors.rows[0].count}`);
    
    if (parseInt(verifyMajors.rows[0].count) !== 377) {
      throw new Error("Majors count is not 377");
    }

    const postUMajors = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE major_id IS NOT NULL) as matched,
        COUNT(*) FILTER (WHERE major_id IS NULL) as unmatched
      FROM university_majors;
    `);
    
    console.log("Verification results:", postUMajors.rows[0]);

    if (postUMajors.rows[0].total !== uMajorsCount.rows[0].count) {
      throw new Error(`Total university_majors changed! Was ${uMajorsCount.rows[0].count}, now ${postUMajors.rows[0].total}`);
    }

    await client.query('COMMIT');
    console.log("Migration executed successfully!");
  } catch(e) {
    await client.query('ROLLBACK');
    console.error("Migration failed, rolled back! Error:", e);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
