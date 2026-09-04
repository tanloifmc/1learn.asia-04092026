const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/raw/batch1_careers.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

// 1. Remove duplicate (CAR_LAW_08 is duplicate of CAR_ECO_12 for Internal Auditor)
// 2. Clean up career_name_vi by removing English text in parentheses e.g. "Kỹ sư thiết kế vi mạch số (Digital IC Design Engineer)" -> "Kỹ sư thiết kế vi mạch số"

let cleanedRecords = [];
const seenEn = new Set();

for (let record of data.records) {
  // Fix taxonomy: remove text in parentheses at the end of the Vietnamese name
  record.career_name_vi = record.career_name_vi.replace(/\s*\([^)]*\)\s*$/, '').trim();
  
  // Dedup logic
  const enName = record.career_name_en.toLowerCase().trim();
  if (seenEn.has(enName)) {
    console.log(`Removed duplicate: ${record.career_name_en} (${record.career_code})`);
    continue;
  }
  
  seenEn.add(enName);
  cleanedRecords.push(record);
}

data.records = cleanedRecords;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log(`Cleanup complete. Total records remaining: ${cleanedRecords.length}`);
