import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditUnis() {
  const { data: unis, error } = await supabase.from('universities').select('*');
  
  if (error) {
    console.error("Error fetching universities:", error);
    process.exit(1);
  }

  console.log(`Total Universities in DB: ${unis.length}`);
}

auditUnis();
