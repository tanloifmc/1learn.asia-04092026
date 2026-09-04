import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// ---------------------------------------------------------
// 1. CONFIGURATION & TYPES
// ---------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), 'data', 'university-batch1');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const PDF_DIR = path.join(RAW_DIR, 'pdf');
const NORMALIZED_DIR = path.join(DATA_DIR, 'normalized');
const CANDIDATES_DIR = path.join(DATA_DIR, 'candidates');
const EVIDENCE_DIR = path.join(DATA_DIR, 'evidence');

const REPORT_PATH = path.join(process.cwd(), 'docs', 'UNIVERSITY_BATCH_1_CURATION_REPORT.md');
const TAXONOMY_PATH = path.join(process.cwd(), 'docs', 'FIELD_MAJOR_TAXONOMY.md');

[RAW_DIR, PDF_DIR, NORMALIZED_DIR, CANDIDATES_DIR, EVIDENCE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

type MappingStatus = 'EXACT_MATCH' | 'ACCEPTED_MATCH' | 'NEEDS_REVIEW' | 'UNMAPPED';
type ExtractionStatus = 'SUCCESS' | 'NO_PROGRAMS_FOUND' | 'EXTRACTION_INCOMPLETE' | 'SOURCE_ACCESS_FAILED';

interface UniversityConfig {
  canonical_name: string;
  short_name: string | null;
  slug: string;
  type: string;
  ownership: string;
  location_city: string;
  website: string;
  sources: { url: string; type: 'HTML' | 'PDF'; year: number; description: string }[];
}

interface ExtractionCoverage {
  university: string;
  official_sources_found: number;
  html_sources: number;
  pdf_sources: number;
  programs_extracted: number;
  status: ExtractionStatus;
}

interface SourceRegistry {
  university: string;
  source_url: string;
  source_type: string;
  year: number;
  accessible: boolean;
  used: boolean;
}

interface OriginalProgram {
  university: string;
  original_program_name: string;
  program_code: string | null;
  source_url: string;
  source_title: string | null;
  source_year: number | null;
  evidence_text: string;
  extraction_method: 'FIRECRAWL_HTML' | 'PDF' | 'HTTP';
}

interface CandidateRelation {
  university: string;
  major: string | null;
  field: string | null;
  original_program_name: string;
  source_url: string;
  evidence_text: string;
  mapping_status: MappingStatus;
}

// ---------------------------------------------------------
// 2. NETWORK & PARSING
// ---------------------------------------------------------

const apiKeys = (process.env.FIRECRAWL_API_KEYS || process.env.FIRECRAWL_API_KEY || '').split(',').map(k => k.trim()).filter(k => k);
let currentKeyIndex = 0;

function getFirecrawlKey() {
  if (apiKeys.length === 0) return null;
  return apiKeys[currentKeyIndex];
}

async function fetchHttp(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function fetchPdfDirect(url: string, slug: string): Promise<string> {
  let headers: any = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };
  
  let res = await fetch(url, { headers });
  let arrayBuffer = await res.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);
  let text = buffer.toString('utf-8');

  // Handle anti-bot challenge (e.g. NEU's document.cookie="D1N=..." reload)
  if (text.includes('document.cookie=')) {
    const match = text.match(/document\.cookie="([^"]+)"/);
    if (match) {
      console.log(`  -> Solving anti-bot challenge: ${match[1]}`);
      headers['Cookie'] = match[1];
      res = await fetch(url, { headers });
      arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
  }

  if (!res.ok) throw new Error(`PDF Fetch Error HTTP ${res.status}`);
  
  const pdfPath = path.join(PDF_DIR, `${slug}-${Date.now()}.pdf`);
  fs.writeFileSync(pdfPath, buffer);
  
  // Use pdf-parse function directly
  const data = await pdfParse(buffer);
  return data.text;
}

async function scrapeWithFirecrawl(url: string, attempt = 1): Promise<string> {
  const key = getFirecrawlKey();
  if (!key) {
     console.warn("No Firecrawl key, falling back to HTTP...");
     return fetchHttp(url);
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({ url, formats: ['markdown'] })
    });
    
    if (response.status === 429) {
      if (currentKeyIndex < apiKeys.length - 1) {
        currentKeyIndex++;
        console.log(`Rate limited on key ${currentKeyIndex}. Switching to next key...`);
        return scrapeWithFirecrawl(url, 1);
      } else {
        if (attempt <= 3) {
          console.log(`Rate limited on all keys. Backing off (attempt ${attempt})...`);
          await new Promise(r => setTimeout(r, attempt * 5000));
          currentKeyIndex = 0;
          return scrapeWithFirecrawl(url, attempt + 1);
        }
        throw new Error(`Rate limit exceeded for URL: ${url}`);
      }
    }
    
    if (!response.ok) {
        if (response.status === 408) throw new Error("Timeout");
        throw new Error(`Firecrawl error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.data?.markdown || '';
  } catch (error) {
    console.error(`Scrape failed for ${url}:`, error);
    throw error;
  }
}

// ---------------------------------------------------------
// 3. TAXONOMY PARSER & STRICT MAPPING
// ---------------------------------------------------------

interface TaxonomyEntry { major: string; slug: string; field: string; }

function parseTaxonomy(): TaxonomyEntry[] {
  if (!fs.existsSync(TAXONOMY_PATH)) throw new Error(`Taxonomy not found at ${TAXONOMY_PATH}`);
  const content = fs.readFileSync(TAXONOMY_PATH, 'utf-8');
  const taxonomy: TaxonomyEntry[] = [];
  let currentField = '';
  
  for (const line of content.split('\n')) {
    const fieldMatch = line.match(/^### [^\s]+ (.*?) \(`/);
    if (fieldMatch) {
      currentField = fieldMatch[1].trim().split('—')[0].trim();
      continue;
    }
    if (line.startsWith('|') && !line.includes('Major | Slug') && !line.includes('---')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 4 && parts[1]) taxonomy.push({ major: parts[1], slug: parts[2], field: currentField });
    }
  }
  return taxonomy;
}

function normalizeString(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ\s]/g, '').trim();
}

function mapToMajor(originalName: string, taxonomy: TaxonomyEntry[]): { major: string | null; field: string | null; status: MappingStatus } {
  // Strip common codes inside parentheses like "Khoa học máy tính (IT1)" -> "Khoa học máy tính"
  let cleanName = originalName.replace(/\([^)]+\)/g, '').trim();
  cleanName = cleanName.replace(/chương trình|ngành|chuyên ngành/ig, '').trim();
  
  const normOriginal = normalizeString(cleanName);
  
  // 1. EXACT_MATCH
  for (const t of taxonomy) {
    if (normOriginal === normalizeString(t.major)) {
        return { major: t.major, field: t.field, status: 'EXACT_MATCH' };
    }
  }
  
  // 2. ACCEPTED_MATCH (Only if we have specific mapping rules or it's highly highly likely, else skip to NEEDS_REVIEW)
  // For POC, we skip direct partial match to prevent "Điện tử viễn thông" matching "Điện".
  
  // 3. NEEDS_REVIEW
  const keywords = ['kỹ thuật', 'công nghệ', 'quản trị', 'ngôn ngữ', 'sư phạm', 'khoa học', 'kinh tế', 'luật', 'y', 'dược', 'thiết kế', 'toán', 'vật lý', 'hóa học', 'sinh học'];
  if (keywords.some(k => normOriginal.includes(k))) return { major: null, field: null, status: 'NEEDS_REVIEW' };
  
  // 4. UNMAPPED
  return { major: null, field: null, status: 'UNMAPPED' };
}

// ---------------------------------------------------------
// 4. HEURISTIC EXTRACTION (FLEXIBLE)
// ---------------------------------------------------------

function extractProgramsFromText(text: string, universityName: string, source: any): OriginalProgram[] {
  const programs: OriginalProgram[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const majorKeywords = /kỹ thuật|công nghệ|khoa học|quản trị|kinh tế|kế toán|ngôn ngữ|sư phạm|y khoa|luật|thiết kế|truyền thông|máy tính|toán|vật lý/i;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Markdown Table Extraction
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 2 && !line.includes('---')) {
        const potentialName = parts.find(p => p.length > 5 && majorKeywords.test(p));
        const potentialCode = parts.find(p => /^[A-Z0-9]{2,10}$/.test(p));
        if (potentialName && !potentialName.toLowerCase().includes('tên ngành')) {
           programs.push({
             university: universityName,
             original_program_name: potentialName.replace(/\*+/g, ''),
             program_code: potentialCode || null,
             source_url: source.url,
             source_title: source.description,
             source_year: source.year,
             evidence_text: line,
             extraction_method: source.type === 'PDF' ? 'PDF' : 'FIRECRAWL_HTML'
           });
           continue;
        }
      }
    }

    // List/Bullet Extraction (e.g. "1. Khoa học máy tính", "- Kỹ thuật điện")
    const listMatch = line.match(/^(?:\d+[\.\)]|-|\*)\s+(.*)/);
    if (listMatch) {
       let potentialName = listMatch[1].trim();
       let code = null;
       
       // Handle "IT1 - Khoa học máy tính" or "Khoa học máy tính (IT1)"
       const codeMatch = potentialName.match(/\(([A-Z0-9]{2,8})\)/);
       if (codeMatch) {
           code = codeMatch[1];
       } else {
           const splitDash = potentialName.split(/[-–—:]/);
           if (splitDash.length >= 2) {
               const p1 = splitDash[0].trim();
               const p2 = splitDash.slice(1).join('-').trim();
               if (/^[A-Z0-9]{2,10}$/.test(p1)) {
                   code = p1;
                   potentialName = p2;
               }
           }
       }
       
       if (potentialName.length > 5 && potentialName.length < 150 && majorKeywords.test(potentialName)) {
           programs.push({
             university: universityName,
             original_program_name: potentialName.replace(/\*+/g, ''),
             program_code: code,
             source_url: source.url,
             source_title: source.description,
             source_year: source.year,
             evidence_text: line,
             extraction_method: source.type === 'PDF' ? 'PDF' : 'FIRECRAWL_HTML'
           });
       }
       continue;
    }
    
    // PDF Raw text table heuristic (Often codes and names are space-separated on one line)
    // E.g. "7480201 Khoa học máy tính" or "IT1 Khoa học máy tính"
    const rawCodeMatch = line.match(/^([A-Z0-9]{5,10})\s+(.+)/);
    if (rawCodeMatch && source.type === 'PDF') {
        const potentialCode = rawCodeMatch[1];
        const potentialName = rawCodeMatch[2].trim();
        if (potentialName.length > 5 && majorKeywords.test(potentialName)) {
            programs.push({
             university: universityName,
             original_program_name: potentialName.replace(/\*+/g, ''),
             program_code: potentialCode,
             source_url: source.url,
             source_title: source.description,
             source_year: source.year,
             evidence_text: line,
             extraction_method: 'PDF'
           });
        }
    }
  }
  
  // Deduplicate within the same source based on name
  const unique = [];
  const seen = new Set();
  for (const p of programs) {
      const key = p.original_program_name.toLowerCase().replace(/\s+/g, '');
      if (!seen.has(key)) {
          seen.add(key);
          unique.push(p);
      }
  }
  return unique;
}

// ---------------------------------------------------------
// 5. MAIN PIPELINE
// ---------------------------------------------------------

async function runPipeline() {
  console.log("Starting University Batch 1 Extraction Pipeline (POC)...");
  
  const taxonomy = parseTaxonomy();
  console.log(`Loaded ${taxonomy.length} majors from taxonomy.`);

  const universities: UniversityConfig[] = [
    {
      canonical_name: 'Đại học Bách khoa Hà Nội',
      short_name: 'HUST',
      slug: 'dai-hoc-bach-khoa-ha-noi',
      type: 'Public',
      ownership: 'Bộ Giáo dục và Đào tạo',
      location_city: 'Hà Nội',
      website: 'https://hust.edu.vn',
      sources: [
          // Preferred source: Training categories
          { url: 'https://ts.hust.edu.vn/training-cate/nganh-dao-tao-dai-hoc', type: 'HTML', year: 2026, description: 'Danh mục chương trình đào tạo đại học' },
          { url: 'https://ts.hust.edu.vn/tin-tuc/diem-chuan-dai-hoc-bach-khoa-ha-noi-nam-2026', type: 'HTML', year: 2026, description: 'Điểm chuẩn 2026' }
      ]
    },
    {
      canonical_name: 'Đại học Kinh tế Quốc dân',
      short_name: 'NEU',
      slug: 'dai-hoc-kinh-te-quoc-dan',
      type: 'Public',
      ownership: 'Bộ Giáo dục và Đào tạo',
      location_city: 'Hà Nội',
      website: 'https://neu.edu.vn',
      sources: [
          { url: 'https://daotao.neu.edu.vn/Resources/Docs/SubDomain/daotao/TuyenSinh2026/GT%20Ng%C3%A0nh%20v%C3%A0%20CT%C4%90T%20-%20%C4%90HCQ%202026.pdf', type: 'PDF', year: 2026, description: 'Đề án/Giới thiệu ngành tuyển sinh 2026 (PDF)' }
      ]
    }
  ];

  const allCoverage: ExtractionCoverage[] = [];
  const allRegistry: SourceRegistry[] = [];
  const allOriginalPrograms: OriginalProgram[] = [];
  const allCandidates: CandidateRelation[] = [];

  for (const uni of universities) {
    console.log(`\nProcessing ${uni.canonical_name}...`);
    let programsForUni: OriginalProgram[] = [];
    let pdfSources = 0;
    let htmlSources = 0;
    
    for (const source of uni.sources) {
        console.log(`- Accessing source: ${source.url} (${source.type})`);
        let content = '';
        let accessible = false;

        try {
            if (source.type === 'PDF') {
                pdfSources++;
                // Fallback architecture for PDF: Attempt Firecrawl if PDF URL, otherwise direct HTTP + pdf-parse
                try {
                    content = await fetchPdfDirect(source.url, uni.slug);
                    accessible = true;
                    console.log(`  -> Downloaded and parsed PDF directly (${content.length} chars).`);
                } catch (e: any) {
                    console.warn(`  -> Direct PDF fetch failed, attempting Firecrawl...`);
                    content = await scrapeWithFirecrawl(source.url);
                    accessible = true;
                }
            } else {
                htmlSources++;
                content = await scrapeWithFirecrawl(source.url);
                accessible = true;
            }
            
            fs.writeFileSync(path.join(RAW_DIR, `${uni.slug}-${Date.now()}.txt`), content);
            
            const extracted = extractProgramsFromText(content, uni.canonical_name, source);
            console.log(`  -> Extracted ${extracted.length} programs from this source.`);
            programsForUni.push(...extracted);

        } catch (e: any) {
            console.error(`  -> Failed to access source: ${e.message}`);
        }

        allRegistry.push({
            university: uni.canonical_name,
            source_url: source.url,
            source_type: source.type,
            year: source.year,
            accessible,
            used: programsForUni.length > 0
        });
    }

    // Deduplicate across sources for the university
    const uniqueProgs = [];
    const seen = new Set();
    for (const p of programsForUni) {
        const norm = normalizeString(p.original_program_name);
        if (!seen.has(norm)) {
            seen.add(norm);
            uniqueProgs.push(p);
        }
    }

    let status: ExtractionStatus = 'SUCCESS';
    if (uniqueProgs.length === 0) {
        if (allRegistry.some(r => r.university === uni.canonical_name && r.accessible)) {
            status = 'EXTRACTION_INCOMPLETE'; // Accessible but 0 extracted
        } else {
            status = 'SOURCE_ACCESS_FAILED';
        }
    }

    allCoverage.push({
        university: uni.canonical_name,
        official_sources_found: uni.sources.length,
        html_sources: htmlSources,
        pdf_sources: pdfSources,
        programs_extracted: uniqueProgs.length,
        status
    });

    allOriginalPrograms.push(...uniqueProgs);

    // Mappings
    for (const prog of uniqueProgs) {
        const mapping = mapToMajor(prog.original_program_name, taxonomy);
        allCandidates.push({
            university: uni.canonical_name,
            original_program_name: prog.original_program_name,
            major: mapping.major,
            field: mapping.field,
            source_url: prog.source_url,
            evidence_text: prog.evidence_text.replace(/\n/g, ' ').substring(0, 150),
            mapping_status: mapping.status
        });
    }
  }

  // Generate Report
  console.log('\nGenerating Report...');
  let report = `# UNIVERSITY BATCH 1 CURATION REPORT\n\n`;
  report += `## 1. Methodology\n- Engine: TypeScript + Firecrawl (HTML) + pdf-parse (PDF direct download).\n- Source Registry: Hardcoded explicit official sources to prevent LLM hallucination.\n- Mapping Strategy: Strict matching. No blind ACCEPTED_MATCH without exact normalization.\n- No database writes executed.\n\n`;
  
  report += `## 2. Extraction Coverage\n`;
  report += `| University | Official sources found | HTML | PDF | Programs extracted | Extraction status |\n| --- | --- | --- | --- | --- | --- |\n`;
  allCoverage.forEach(c => {
      report += `| ${c.university} | ${c.official_sources_found} | ${c.html_sources} | ${c.pdf_sources} | ${c.programs_extracted} | ${c.status} |\n`;
  });
  report += `\n`;

  report += `## 3. Source Registry\n`;
  report += `| University | Source URL | Source Type | Year | Accessible | Used |\n| --- | --- | --- | --- | --- | --- |\n`;
  allRegistry.forEach(r => {
      report += `| ${r.university} | ${r.source_url} | ${r.source_type} | ${r.year} | ${r.accessible} | ${r.used} |\n`;
  });
  report += `\n`;

  report += `## 4. Program Evidence\n`;
  report += `| University | Original Program | Code | Source URL | Evidence | Method |\n| --- | --- | --- | --- | --- | --- |\n`;
  allOriginalPrograms.forEach(p => {
      report += `| ${p.university} | ${p.original_program_name} | ${p.program_code || 'N/A'} | ${p.source_url} | \`${p.evidence_text.replace(/\n/g, ' ').substring(0, 100)}\` | ${p.extraction_method} |\n`;
  });
  report += `\n`;

  report += `## 5. Mapping\n`;
  report += `| University | Original Program | Existing Major | Field | Status | Source URL |\n| --- | --- | --- | --- | --- | --- |\n`;
  allCandidates.filter(c => c.mapping_status === 'EXACT_MATCH' || c.mapping_status === 'ACCEPTED_MATCH').forEach(c => {
      report += `| ${c.university} | ${c.original_program_name} | ${c.major} | ${c.field} | ${c.mapping_status} | ${c.source_url} |\n`;
  });
  report += `\n`;

  report += `## 6. UNMAPPED\n`;
  report += `| University | Original Program | Source URL | Evidence |\n| --- | --- | --- | --- |\n`;
  allCandidates.filter(c => c.mapping_status === 'UNMAPPED').forEach(c => {
      report += `| ${c.university} | ${c.original_program_name} | ${c.source_url} | \`${c.evidence_text}\` |\n`;
  });
  report += `\n`;

  report += `## 7. NEEDS_REVIEW\n`;
  report += `| University | Original Program | Source URL | Evidence |\n| --- | --- | --- | --- |\n`;
  allCandidates.filter(c => c.mapping_status === 'NEEDS_REVIEW').forEach(c => {
      report += `| ${c.university} | ${c.original_program_name} | ${c.source_url} | \`${c.evidence_text}\` |\n`;
  });

  fs.writeFileSync(REPORT_PATH, report);
  fs.writeFileSync(path.join(CANDIDATES_DIR, 'candidates.json'), JSON.stringify(allCandidates, null, 2));

  console.log(`Report generated at: ${REPORT_PATH}`);
  
  // Validation
  const valid = allCoverage.every(c => c.status === 'SUCCESS' && c.programs_extracted > 0);
  console.log(`\nValidation: ${valid ? 'PASS' : 'EXTRACTION_INCOMPLETE'}. Done.`);
}

runPipeline().catch(console.error);
