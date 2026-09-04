const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/raw/batch1_careers.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);
const records = data.records;

const report = {
  total: records.length,
  vietnam_relevance: {
    VERIFIED_VIETNAM: 0,
    PLAUSIBLE_VIETNAM: 0,
    INTERNATIONAL_ONLY: 0,
    UNSUPPORTED: 0
  },
  source_categories: {
    OFFICIAL_VIETNAM: 0,
    VIETNAM_EDUCATION: 0,
    VIETNAM_PROFESSIONAL: 0,
    INTERNATIONAL: 0,
    SECONDARY: 0,
    INVALID: 0
  },
  source_concentration: {},
  taxonomy_issues: [],
  riasec_issues: 0,
  suspicious_records: []
};

// Known Vietnam domains
const vnDomains = [
  '.vn', 'itviec.com', 'topcv.vn', 'careerviet.vn', 'careerbuilder.vn', 
  'vietnamworks.com', 'jobsgo.vn', 'glints.com/vn', 'timviec365.vn', 'navigossearch.com',
  'adecco.com.vn', 'manpower.com.vn'
];

const knownEdu = ['.edu.vn'];
const knownGov = ['.gov.vn'];

// Exact name checking
const namesVi = new Map();
const namesEn = new Map();

for (const record of records) {
  // 1 & 2. Source & Vietnam relevance
  let isVn = false;
  let category = 'INVALID';
  
  if (record.source && record.source.url) {
    const url = record.source.url.toLowerCase();
    
    // Check concentration
    report.source_concentration[url] = (report.source_concentration[url] || 0) + 1;
    
    if (vnDomains.some(d => url.includes(d)) || url.includes('vietnam')) {
      isVn = true;
      if (knownEdu.some(d => url.includes(d))) category = 'VIETNAM_EDUCATION';
      else if (knownGov.some(d => url.includes(d))) category = 'OFFICIAL_VIETNAM';
      else category = 'VIETNAM_PROFESSIONAL';
    } else {
      category = 'INTERNATIONAL';
    }
  } else {
    category = 'INVALID';
  }
  
  report.source_categories[category]++;
  
  if (category === 'INVALID') {
    report.vietnam_relevance.UNSUPPORTED++;
    report.suspicious_records.push({ code: record.career_code, issue: 'No Source / Invalid URL' });
  } else if (isVn) {
    report.vietnam_relevance.VERIFIED_VIETNAM++;
  } else if (category === 'INTERNATIONAL') {
    // Check if the evidence mentions Vietnam
    if (record.source.evidence && (record.source.evidence.toLowerCase().includes('việt nam') || record.source.evidence.toLowerCase().includes('vietnam'))) {
      report.vietnam_relevance.PLAUSIBLE_VIETNAM++;
    } else {
      report.vietnam_relevance.INTERNATIONAL_ONLY++;
      report.suspicious_records.push({ code: record.career_code, issue: 'International source, no VN context' });
    }
  }
  
  // 3 & 5. Taxonomy & Duplicates
  const nameViLower = record.career_name_vi.toLowerCase();
  if (namesVi.has(nameViLower)) {
    report.taxonomy_issues.push(`DUPLICATE VI: ${record.career_name_vi} (${record.career_code} vs ${namesVi.get(nameViLower)})`);
  } else {
    namesVi.set(nameViLower, record.career_code);
  }
  
  const nameEnLower = record.career_name_en.toLowerCase();
  if (namesEn.has(nameEnLower)) {
    report.taxonomy_issues.push(`DUPLICATE EN: ${record.career_name_en} (${record.career_code} vs ${namesEn.get(nameEnLower)})`);
  } else {
    namesEn.set(nameEnLower, record.career_code);
  }
  
  // Broad / Narrow heuristics
  if (record.career_name_vi.split(' ').length > 8) {
    report.taxonomy_issues.push(`TOO SPECIFIC/LONG: ${record.career_name_vi} (${record.career_code})`);
  }
  if (record.career_name_vi.split(' ').length === 1) {
    report.taxonomy_issues.push(`TOO BROAD/SHORT: ${record.career_name_vi} (${record.career_code})`);
  }
  
  // 6. RIASEC
  if (record.riasec_code !== null) {
    report.riasec_issues++;
  }
}

// Convert concentration to sorted array
const sortedConcentration = Object.entries(report.source_concentration)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10); // top 10

console.log(JSON.stringify({
  total: report.total,
  vietnam_relevance: report.vietnam_relevance,
  source_categories: report.source_categories,
  top_sources: sortedConcentration,
  taxonomy_issues: report.taxonomy_issues,
  riasec_issues: report.riasec_issues,
  suspicious_records: report.suspicious_records
}, null, 2));
