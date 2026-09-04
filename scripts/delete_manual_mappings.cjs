require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
pool.query("DELETE FROM career_major_mappings WHERE source = 'E2E_AUDIT_MANUAL'").then(r => { 
  console.log('Deleted rows:', r.rowCount); 
  pool.end(); 
});
