import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function importUniversities() {
  const filePath = path.join(__dirname, '../danh sach cac truong.txt');
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n');

  const records = [];
  
  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = lines[i].split('\t');
    const name = cols[1]?.trim();
    const code = cols[2]?.trim();
    
    if (!name || !code) {
        console.log(`Skipping invalid line: ${line}`);
        continue;
    }

    const baseSlug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const slug = `${baseSlug}-${code.toLowerCase()}`;

    records.push({
      code: code,
      name: name,
      slug: slug,
      status: 'published'
    });
  }

  console.log(`Starting import of ${records.length} universities...`);

  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('universities')
      .upsert(batch, { onConflict: 'code' });

    if (error) {
      console.error(`Error importing batch starting at index ${i}:`, error);
      process.exit(1);
    }
  }

  console.log('Import completed successfully!');
}

importUniversities().catch(console.error);
