import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function importMajors() {
  const dataPath = path.join(__dirname, '../scratch/extracted_majors.json');
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const records = rawData.map((m: any) => ({
    code: m.code,
    name: m.name,
    field: m.field,
    description: null, // As requested by CTO: leave null if schema allows
    status: 'published'
  }));

  console.log(`Starting import of ${records.length} majors...`);

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    const batchToInsert = batch.map((r: any) => {
        const baseSlug = r.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
        return {
            ...r,
            slug: `${baseSlug}-${r.code}`
        };
    });

    const { error } = await supabase
      .from('majors')
      .upsert(batchToInsert, { onConflict: 'slug' });

    if (error) {
      console.error(`Error importing batch starting at index ${i}:`, error);
      
      // If error is about NOT NULL constraint on description, try with empty string
      if (error.message.includes('null value in column "description"')) {
         console.log("Schema requires description. Retrying with 'Đang cập nhật'...");
         const fixedBatch = batchToInsert.map((r: any) => ({...r, description: 'Đang cập nhật'}));
         const { error: retryError } = await supabase.from('majors').upsert(fixedBatch, { onConflict: 'slug' });
         if (retryError) {
             console.error("Retry failed:", retryError);
             process.exit(1);
         }
      } else {
        process.exit(1);
      }
    }
  }

  console.log('Import completed successfully!');
}

importMajors();
