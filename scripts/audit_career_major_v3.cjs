require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function audit() {
  const { count: careersCount } = await supabase.from('careers').select('*', { count: 'exact', head: true });
  const { data: majors } = await supabase.from('majors').select('id, code, name, slug');
  const majorsCount = majors ? majors.length : 0;
  
  const { data: mappings } = await supabase.from('career_major_mappings').select('*');
  const existingMappingsCount = mappings ? mappings.length : 0;
  
  const verifiedMappings = mappings ? mappings.filter(m => m.source_url || m.evidence || (m.source && m.source !== 'system_default')) : [];
  const verifiedMappingsCount = verifiedMappings.length;
  
  const { data: uniMajors } = await supabase.from('university_majors').select('major_id');
  const uniMajorsSet = new Set(uniMajors ? uniMajors.map(u => u.major_id) : []);
  const majorsWithoutUni = majors ? majors.filter(m => !uniMajorsSet.has(m.id)).length : 0;

  console.log(`Careers: ${careersCount}`);
  console.log(`Majors: ${majorsCount}`);
  console.log(`Existing Mappings: ${existingMappingsCount}`);
  console.log(`Verified Mappings: ${verifiedMappingsCount}`);
  console.log(`Careers without mapping: ${careersCount - existingMappingsCount}`);
  console.log(`Majors without University offering: ${majorsWithoutUni}`);
}

audit().catch(console.error);
