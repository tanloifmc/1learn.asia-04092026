import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: version } = await supabase.from('assessment_versions').select('*').eq('status', 'published').single();
  const { data: dimensions } = await supabase.from('assessment_dimensions').select('*').eq('version_id', version.id);
  const { data: questions } = await supabase.from('assessment_questions').select('*').eq('version_id', version.id);

  console.log(`Version: ${version.id}`);
  console.log(`Questions count: ${questions.length}`);
  console.log(`Dimensions count: ${dimensions.length}`);

  const hasBigFive = questions.some((q: any) => {
    const dim = dimensions.find((d: any) => d.id === q.dimension_id);
    return dim && dim.framework === 'big_five';
  });
  const hasWorkValues = questions.some((q: any) => {
    const dim = dimensions.find((d: any) => d.id === q.dimension_id);
    return dim && dim.framework === 'work_values';
  });

  console.log(`- Big Five Questions present in version: ${hasBigFive ? 'YES' : 'NO'}`);
  console.log(`- Work Values Questions present in version: ${hasWorkValues ? 'YES' : 'NO'}`);
}
run();
