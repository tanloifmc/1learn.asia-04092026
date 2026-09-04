import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function main() {
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const d = await s.from('assessment_dimensions').select('framework');
  console.log([...new Set(d.data?.map(x=>x.framework))]);
}
main();
