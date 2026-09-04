const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Select the 7 records
    const res1 = await client.query(`
      SELECT ad.id, ad.data_status 
      FROM admission_data ad
      JOIN university_majors um ON ad.university_major_id = um.id
      WHERE ad.data_status = 'published' AND (um.status != 'published' OR um.status IS NULL)
    `);
    
    console.log("Records before update:");
    console.table(res1.rows);
    
    if (res1.rowCount !== 7) {
      throw new Error(`Expected exactly 7 records, but found ${res1.rowCount}`);
    }

    const ids = res1.rows.map(r => r.id);
    
    // Update them
    const updateRes = await client.query(`
      UPDATE admission_data 
      SET data_status = 'draft' 
      WHERE id = ANY($1) 
      RETURNING id, data_status
    `, [ids]);
    
    console.log("\nRecords after update:");
    console.table(updateRes.rows);
    
    await client.query('COMMIT');
    console.log("\nTransaction committed successfully.");
  } catch(e) {
    await client.query('ROLLBACK');
    console.error("Transaction failed, rolled back:", e);
  } finally {
    client.release();
    pool.end();
  }
}
run().catch(console.error);
