import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("Fetching majors and universities from DB...");
  const { data: dbMajors, error: errMajors } = await supabase.from('majors').select('id, code');
  const { data: dbUnis, error: errUnis } = await supabase.from('universities').select('id, code');

  if (errMajors || errUnis) {
    console.error("DB Fetch Error", errMajors, errUnis);
    process.exit(1);
  }

  const majorMap = new Map(); // code -> id
  dbMajors.forEach(m => {
      if (m.code) majorMap.set(m.code, m.id);
  });

  const uniMap = new Map(); // code -> id
  dbUnis.forEach(u => {
      if (u.code) uniMap.set(u.code, u.id);
  });

  console.log(`DB loaded: ${dbMajors.length} majors, ${dbUnis.length} universities.`);

  const candidatePath = path.join(__dirname, '../data/national_universities_candidate.json');
  const candidates = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));

  let totalUniversities = candidates.length;
  let totalPrograms = 0;
  let exactMajorCodeMatches = 0;
  let unmatchedMajorCodes = 0;
  let programsWithoutMajorCode = 0;
  let universitiesNotFound = 0;
  let duplicateMappings = 0;
  let invalidNullData = 0;

  const notFoundUnis = new Set();
  const notFoundMajors = new Set();

  for (const uni of candidates) {
    const uniCode = uni.original_university_code;
    const isUniValid = uniMap.has(uniCode);
    
    if (!isUniValid) {
        universitiesNotFound++;
        notFoundUnis.add(uniCode);
    }

    if (!uni.majors || !Array.isArray(uni.majors)) continue;

    const seenMajorCodesInUni = new Set();

    for (const program of uni.majors) {
      totalPrograms++;
      
      const majorCode = program.original_major_code?.trim();
      const programName = program.original_major_name?.trim();

      if (!majorCode) {
        programsWithoutMajorCode++;
        continue;
      }

      if (!programName) {
        invalidNullData++;
      }

      if (majorMap.has(majorCode)) {
        exactMajorCodeMatches++;
        if (seenMajorCodesInUni.has(majorCode)) {
           duplicateMappings++;
        } else {
           seenMajorCodesInUni.add(majorCode);
        }
      } else {
        unmatchedMajorCodes++;
        notFoundMajors.add(majorCode);
      }
    }
  }

  const report = `# BATCH 3: UNIVERSITY ↔ MAJOR MAPPING AUDIT
*Date: ${new Date().toISOString()}*

## 1. Overview
This audit evaluates the deterministic mapping between the real-world admissions data (\`data/national_universities_candidate.json\`) and the Core Platform's \`majors\` and \`universities\` master tables.

**Rules Applied:**
- EXACT-MATCH ONLY on \`major_code\` and \`university_code\`. No AI fuzzy matching.
- Any mismatch is flagged as \`UNMAPPED\`.

## 2. Quantitative Results

| Metric | Count |
|--------|-------|
| Total Universities in candidate file | **${totalUniversities}** |
| Total Programs in candidate file | **${totalPrograms}** |
| Exact Major-Code Matches | **${exactMajorCodeMatches}** |
| Unmatched Major Codes | **${unmatchedMajorCodes}** |
| Programs without Major Code | **${programsWithoutMajorCode}** |
| Universities not found in DB | **${universitiesNotFound}** |
| Duplicate (University + Major) combinations | **${duplicateMappings}** |
| Invalid/Null Program Names | **${invalidNullData}** |

## 3. Findings

### Universities Mismatch
${universitiesNotFound} universities in the candidate file were not found in the DB (based on exact \`code\` match).
*Sample missing codes: ${Array.from(notFoundUnis).slice(0, 10).join(', ')}*

### Majors Mismatch
${unmatchedMajorCodes} programs refer to a major code that does not exist in the 377 Master Majors.
*Sample missing major codes: ${Array.from(notFoundMajors).slice(0, 10).join(', ')}*

### Duplicate Mappings (Constraint Violation Risk)
There are ${duplicateMappings} instances where a university offers multiple programs mapping to the **same** \`major_code\`.
Because the \`university_majors\` table has a \`UNIQUE(university_id, major_id, program_type)\` constraint, we MUST carefully assign \`program_type\` (e.g., Standard, High Quality) or rely on Postgres's handling of NULLs for this constraint to avoid collision if multiple programs are inserted with \`program_type = null\`.

## 4. Conclusion
**MAPPING_REVIEW_REQUIRED**
Before proceeding with import, please review the exact match rate and duplicate handling.
`;

  fs.writeFileSync(path.join(__dirname, '../docs/BATCH3_UNIVERSITY_MAJOR_MAPPING_AUDIT.md'), report);
  console.log("Audit complete. Report generated at docs/BATCH3_UNIVERSITY_MAJOR_MAPPING_AUDIT.md");
}

runAudit().catch(console.error);
