import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: dims } = await supabase.from('assessment_dimensions').select('code, framework');
  const bf = dims?.filter(d => d.framework === 'big_five').map(d => d.code);
  const wv = dims?.filter(d => d.framework === 'work_values').map(d => d.code);
  console.log('Big Five Codes:', bf);
  console.log('Work Values Codes:', wv);
}
run();
