const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function wipe(table) {
  console.log(`Wiping ${table}...`);
  const { error: delError } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) {
    console.error(`Error wiping ${table}:`, delError.message);
  } else {
    console.log(`Wiped ${table} successfully.`);
  }
}

async function run() {
  const tables = [
    'roadmaps',
    'career_audit_log',
    'career_matches',
    'student_career_profiles',
    'university_majors',
    'universities',
    'majors',
    'careers'
  ];

  for (const table of tables) {
    await wipe(table);
  }
  
  console.log('Force wipe completed.');
}

run().catch(console.error);
