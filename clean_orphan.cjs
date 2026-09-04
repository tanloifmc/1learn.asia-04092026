const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: sessions, error } = await supabase
    .from('assessment_sessions')
    .select('id, student_id, started_at')
    .eq('status', 'in_progress')
    .neq('id', '3249557a-29bb-4643-8b8f-e15d69ca55d8');
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log('Found ' + sessions.length + ' sessions to delete.');
  
  for (const s of sessions) {
    console.log('Deleting session ' + s.id + ' and user ' + s.student_id);
    
    // Check if responses exist just to be safe
    await supabase.from('assessment_responses').delete().eq('session_id', s.id);
    
    // Check if results exist just to be safe
    await supabase.from('assessment_results').delete().eq('session_id', s.id);
    
    // Delete session
    await supabase.from('assessment_sessions').delete().eq('id', s.id);
    
    // Delete the test user!
    await supabase.auth.admin.deleteUser(s.student_id);
  }
  
  console.log('Done cleaning up.');
}
run();
