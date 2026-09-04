import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditMajors() {
  const { data: majors, error } = await supabase.from('majors').select('*');
  
  if (error) {
    console.error("Error fetching majors:", error);
    process.exit(1);
  }

  console.log(`Total Majors in DB: ${majors.length}`);
  
  const codes = new Set();
  const slugs = new Set();
  const duplicateCodes = [];
  const duplicateSlugs = [];
  const invalidFields = [];
  
  for (const m of majors) {
    if (codes.has(m.code)) duplicateCodes.push(m.code);
    else codes.add(m.code);
    
    if (slugs.has(m.slug)) duplicateSlugs.push(m.slug);
    else slugs.add(m.slug);
    
    // Check required fields based on schema (code, name, slug, field, status)
    if (!m.name || !m.code || !m.slug || !m.field || !m.status) {
      invalidFields.push(m.code);
    }
  }

  console.log("Duplicate Codes:", duplicateCodes);
  console.log("Duplicate Slugs:", duplicateSlugs);
  console.log("Invalid Required Fields Count:", invalidFields.length);
  
  if (majors.length === 377 && duplicateCodes.length === 0 && duplicateSlugs.length === 0 && invalidFields.length === 0) {
      console.log("\nAUDIT PASSED: Schema Integrity Maintained.");
  } else {
      console.log("\nAUDIT FAILED");
  }
}

auditMajors();
