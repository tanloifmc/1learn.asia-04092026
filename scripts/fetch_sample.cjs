const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function run() {
  const careers = await pool.query("SELECT id, code, name FROM careers LIMIT 10");
  console.log("=== 10 CAREERS ===");
  careers.rows.forEach(r => console.log(`${r.id} | ${r.code} | ${r.name}`));

  const majors = await pool.query("SELECT id, slug, name FROM majors LIMIT 30");
  console.log("\n=== 30 MAJORS ===");
  majors.rows.forEach(r => console.log(`${r.id} | ${r.slug} | ${r.name}`));

  await pool.end();
}
run();
