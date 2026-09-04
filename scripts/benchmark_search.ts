import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function benchmark() {
  console.log("Benchmarking JSONB search on 500+ records...");
  
  const targetSkillCode = 'programming';
  
  const startTime = performance.now();
  
  // PostgREST syntax for checking if JSONB array contains an element
  // Since 'skills' is an array of objects, we can check if it contains an object with {code: "programming"}
  const { data, error, count } = await supabase
    .from('careers')
    .select('id, code, name', { count: 'exact' })
    .contains('skills', `[{"code": "${targetSkillCode}"}]`);

  const endTime = performance.now();
  
  if (error) {
    console.error("Query error:", error);
    return;
  }
  
  console.log(`Found ${count} careers with skill '${targetSkillCode}' in ${(endTime - startTime).toFixed(2)} ms`);
  if (data && data.length > 0) {
    console.log(`Sample result:`, data[0]);
  }
}

benchmark().catch(console.error);
