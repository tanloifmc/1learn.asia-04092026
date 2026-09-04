import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: version } = await supabase.from('assessment_versions').select('id, scoring_rules_version').eq('status', 'published').single();
  console.log('Version:', version);

  if (version) {
    const { data: questions } = await supabase.from('assessment_questions').select('id, question_code, dimension_id').eq('version_id', version.id);
    console.log(`Found ${questions?.length} questions`);

    const { data: sessions } = await supabase.from('assessment_sessions').select('id, student_id, status').limit(5);
    console.log('Sessions:', sessions);
  }
}
run();
