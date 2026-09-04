const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
    
    // Disable triggers temporarily is not possible on Supabase without superuser (which we don't have via pooler). 
    // Instead we CASCADE truncate which takes care of everything (including triggers sometimes, or we just drop data from dependents)
    
    // We already truncated most things. Let's just run TRUNCATE careers CASCADE;
    console.log("Running TRUNCATE careers CASCADE...");
    await client.query('TRUNCATE TABLE careers CASCADE;');
    console.log("Truncate successful.");
    
  } catch(e) {
    console.error("Error:", e.message);
  } finally {
    await client.end();
  }
}
run();
