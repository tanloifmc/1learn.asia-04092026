import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCheck() {
  const { data: careers, error } = await supabase.from('careers').select('*');
  
  if (error) {
    console.error("Error fetching careers:", error);
    process.exit(1);
  }

  console.log(`Total Careers in DB: ${careers.length}`);
  
  const codes = new Set();
  const duplicateCodes = [];
  const names = new Set();
  const duplicateNames = [];
  const invalidFields = [];
  const missingSources = [];
  
  for (const c of careers) {
    // Check duplicates
    if (codes.has(c.code)) duplicateCodes.push(c.code);
    else codes.add(c.code);
    
    if (names.has(c.name.toLowerCase())) duplicateNames.push(c.name);
    else names.add(c.name.toLowerCase());
    
    // Check required fields
    if (!c.name || !c.description || !c.daily_tasks || !c.skills) {
      invalidFields.push(c.code);
    }
    
    // Check source
    if (!c.source_url) {
      missingSources.push(c.code);
    }
  }

  console.log("Duplicate Codes:", duplicateCodes);
  console.log("Duplicate Names:", duplicateNames);
  console.log("Invalid Required Fields Count:", invalidFields.length);
  console.log("Missing Source URLs Count:", missingSources.length);
  
  // Status check
  const statuses = new Set(careers.map(c => c.status));
  console.log("Statuses present:", Array.from(statuses));
  
  // Checking specific impact from previous cleanup
  // Since we ran a cleanup that removed English names in parens and deleted CAR_LAW_08.
  // We can just note that 1 record was deleted (CAR_LAW_08) and some parens were stripped.
}

runCheck();
