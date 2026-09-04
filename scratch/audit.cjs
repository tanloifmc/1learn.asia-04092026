const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("Starting DB Audit...");
  const report = {};

  // 1. Careers
  const { data: careers } = await supabase.from('careers').select('*');
  report.careers = {
    total: careers?.length || 0,
    sources: [...new Set(careers?.map(c => c.source || 'UNKNOWN'))],
    statuses: [...new Set(careers?.map(c => c.status || 'UNKNOWN'))],
    missingSource: careers?.filter(c => !c.source).length || 0,
    educationPathsNull: careers?.filter(c => !c.education_paths).length || 0,
    duplicateCodes: careers ? careers.length - new Set(careers.map(c => c.code)).size : 0,
  };

  // Inspect education_paths json
  let totalPaths = 0;
  let invalidMajorCodes = 0;
  let potentialMajorCodes = new Set();
  careers?.forEach(c => {
    if (c.education_paths && Array.isArray(c.education_paths)) {
      c.education_paths.forEach(p => {
        totalPaths++;
        if (p.major_code) {
          potentialMajorCodes.add(p.major_code);
        } else {
          invalidMajorCodes++;
        }
      });
    }
  });
  report.careers.educationPaths = { totalPaths, invalidMajorCodes, distinctMajorsReferenced: potentialMajorCodes.size };

  // 2. Majors
  const { data: majors } = await supabase.from('majors').select('*');
  report.majors = {
    total: majors?.length || 0,
    sources: [...new Set(majors?.map(m => m.source || 'UNKNOWN'))],
    statuses: [...new Set(majors?.map(m => m.status || 'UNKNOWN'))],
    missingSource: majors?.filter(m => !m.source).length || 0,
    duplicateCodes: majors ? majors.length - new Set(majors.map(m => m.code)).size : 0,
  };

  const validMajorsSet = new Set(majors?.map(m => m.code));
  let orphanMappings = 0;
  potentialMajorCodes.forEach(code => {
    if (!validMajorsSet.has(code)) {
      orphanMappings++;
    }
  });
  report.careers.educationPaths.orphanMappings = orphanMappings;

  // 3. Universities
  const { data: unis } = await supabase.from('universities').select('*');
  report.universities = {
    total: unis?.length || 0,
    sources: [...new Set(unis?.map(u => u.source || 'UNKNOWN'))],
    statuses: [...new Set(unis?.map(u => u.status || 'UNKNOWN'))],
    missingSource: unis?.filter(u => !u.source).length || 0,
    duplicateCodes: unis ? unis.length - new Set(unis.map(u => u.code)).size : 0,
  };

  // 4. University Majors
  const { data: uniMajors } = await supabase.from('university_majors').select('*');
  const validUniIds = new Set(unis?.map(u => u.id));
  const validMajorIds = new Set(majors?.map(m => m.id));

  let orphanUniMajors = 0;
  uniMajors?.forEach(um => {
    if (!validUniIds.has(um.university_id) || !validMajorIds.has(um.major_id)) {
      orphanUniMajors++;
    }
  });

  report.university_majors = {
    total: uniMajors?.length || 0,
    orphanMappings: orphanUniMajors,
    duplicateMappings: uniMajors ? uniMajors.length - new Set(uniMajors.map(um => `${um.university_id}-${um.major_id}`)).size : 0,
    sources: [...new Set(uniMajors?.map(um => um.source || 'UNKNOWN'))],
  };

  // 5. Admission Data
  const { data: admissions } = await supabase.from('admission_data').select('*');
  report.admission_data = {
    total: admissions?.length || 0,
    sources: [...new Set(admissions?.map(a => a.source || 'UNKNOWN'))],
  };

  console.log(JSON.stringify(report, null, 2));
}

runAudit().catch(console.error);
