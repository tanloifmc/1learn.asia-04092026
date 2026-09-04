const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const dirs = [
  'data', 'data/raw', 'data/validated', 'data/imported', 'docs/data-contracts'
];

// Create dirs
dirs.forEach(d => {
  const p = path.join(process.cwd(), d);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
});

async function snapshotAndWipe(table) {
  console.log(`Snapshotting ${table}...`);
  // 1. Fetch all
  let allData = [];
  let from = 0;
  const size = 1000;
  while(true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + size - 1);
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
      break;
    }
    if (data && data.length > 0) {
      allData = allData.concat(data);
      if (data.length < size) break;
      from += size;
    } else {
      break;
    }
  }
  
  if (allData.length > 0) {
    const snapshotFile = path.join(process.cwd(), 'data/raw', `snapshot_${table}_${Date.now()}.json`);
    fs.writeFileSync(snapshotFile, JSON.stringify(allData, null, 2));
    console.log(`Saved ${allData.length} rows to ${snapshotFile}`);
  } else {
    console.log(`${table} is empty. No snapshot created.`);
  }

  console.log(`Wiping ${table}...`);
  const { error: delError } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) {
    console.error(`Error wiping ${table}:`, delError.message);
  } else {
    console.log(`Wiped ${table} successfully.`);
  }
}

async function run() {
  // Ordered by dependency to avoid foreign key constraints failing on delete
  const tables = [
    'admission_data',
    'university_majors',
    'career_majors', // Just in case this exists
    'universities',
    'majors',
    'careers'
  ];

  for (const table of tables) {
    await snapshotAndWipe(table);
  }
  
  console.log('Snapshot and Wipe completed.');
}

run().catch(console.error);
