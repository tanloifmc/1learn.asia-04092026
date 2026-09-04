import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text: string) {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function run() {
  const filePath = path.join(__dirname, '../data/raw/batch1_careers.json');
  console.log(`Reading data from ${filePath}`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const recordsToInsert = data.records.map((r: any) => {
    return {
      code: r.career_code,
      name: r.career_name_vi,
      name_en: r.career_name_en || null,
      slug: slugify(r.career_name_vi) + '-' + r.career_code.toLowerCase().replace(/_/g, '-'), // Ensure uniqueness and no underscores
      career_domain_code: r.career_code.split('_')[1] || 'UNKNOWN',
      description: r.description_vi,
      daily_tasks: r.tasks_vi,
      work_environment: 'mixed', 
      skills: r.skills_required.map((s: string) => ({ name: s, importance: 0.5, type: 'hard' })),
      tools_used: [],
      education_paths: [], // Empty for now, will be populated later
      career_paths: {},
      related_careers: {},
      market_data: {},
      good_fit_indicators: [],
      possible_challenges: [],
      work_style: [],
      company_examples: [],
      riasec_profile: null, // As requested
      status: 'verified',
      source: r.source.name,
      source_url: r.source.url,
      source_type: 'research'
    };
  });

  console.log(`Prepared ${recordsToInsert.length} careers to import.`);

  // Chunk array to avoid large payload errors
  const chunkSize = 100;
  let successCount = 0;
  
  for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
    const chunk = recordsToInsert.slice(i, i + chunkSize);
    console.log(`Importing chunk ${i / chunkSize + 1} (${chunk.length} records)...`);
    
    const { error } = await supabase
      .from('careers')
      .upsert(chunk, { onConflict: 'code' });
      
    if (error) {
      console.error(`Error inserting chunk ${i / chunkSize + 1}:`, error);
      process.exit(1);
    }
    
    successCount += chunk.length;
  }
  
  console.log(`\n✅ Successfully imported ${successCount} verified careers into Supabase!`);
}

run();
