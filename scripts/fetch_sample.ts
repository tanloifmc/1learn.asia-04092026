import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function run() {
  const careers = await pool.query("SELECT id, code, name, job_family FROM careers LIMIT 10");
  console.log("=== 10 CAREERS ===");
  careers.rows.forEach(r => console.log(`${r.code} | ${r.name} | ${r.job_family}`));

  const majors = await pool.query("SELECT id, name FROM majors LIMIT 30");
  console.log("=== 30 MAJORS ===");
  majors.rows.forEach(r => console.log(`${r.id} | ${r.name}`));

  await pool.end();
}
run();
