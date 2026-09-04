import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const email = 'tanloifmc@yahoo.com';
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  if (!user) return console.log("User not found");
  
  console.log("User ID:", user.id);
  
  const { data: results } = await supabase
    .from('assessment_results')
    .select('id, is_current, status')
    .eq('student_id', user.id);
    
  console.log("Assessment Results:", results);
  
  const { data: matchRuns } = await supabase
    .from('match_runs')
    .select('id, status')
    .eq('student_id', user.id);
    
  console.log("Match Runs:", matchRuns);
  
  const { data: roles } = await supabase.from('user_roles').select('*').eq('user_id', user.id);
  console.log("Roles:", roles);
}
check();
