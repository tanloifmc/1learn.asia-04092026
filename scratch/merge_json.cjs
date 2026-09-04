const fs = require('fs');

try {
  const content = fs.readFileSync('data/raw/batch1_careers.json', 'utf8');
  
  // Extract all JSON-like objects using a simple state machine or regex.
  // Since we know the structure has `"dataset": "careers"`, let's try a regex approach 
  // to find all arrays assigned to "records": [ ... ]
  
  const records = [];
  
  // Match everything inside "records": [ ... ]
  // This can be tricky with nested arrays, but our schema only has simple arrays inside records
  // Actually, parsing the whole JSON block is safer.
  
  // Find all occurrences of `{ "dataset": "careers", ... }`
  // We can just find all blocks starting with `{` and ending with `}` that contain `"schema_version": "CAREER-DATA-V1.0"`
  
  const blocks = [];
  let startIndex = 0;
  
  // Let's just find all substrings that look like valid JSON datasets
  // Because regex for full JSON is hard, we can split by "dataset": "careers"
  const parts = content.split('"dataset": "careers"');
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    // reconstruct the string
    let candidate = '{\n  "dataset": "careers"' + part;
    
    // The candidate might trail off into markdown text. We need to find the matching closing brace.
    let braceCount = 0;
    let endIndex = -1;
    let inString = false;
    let escape = false;
    
    for (let j = 0; j < candidate.length; j++) {
      const char = candidate[j];
      
      if (escape) {
        escape = false;
        continue;
      }
      
      if (char === '\\') {
        escape = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = j;
            break;
          }
        }
      }
    }
    
    if (endIndex !== -1) {
      const jsonStr = candidate.substring(0, endIndex + 1);
      try {
        const obj = JSON.parse(jsonStr);
        if (obj.records && Array.isArray(obj.records)) {
          records.push(...obj.records);
        }
      } catch (err) {
        console.error('Failed to parse a JSON block:', err.message);
      }
    }
  }
  
  // De-duplicate records by career_code just in case
  const uniqueRecords = [];
  const seenCodes = new Set();
  for (const r of records) {
    if (!seenCodes.has(r.career_code)) {
      seenCodes.add(r.career_code);
      uniqueRecords.push(r);
    }
  }
  
  const merged = {
    dataset: "careers",
    schema_version: "CAREER-DATA-V1.0",
    records: uniqueRecords
  };
  
  fs.writeFileSync('data/raw/batch1_careers.json', JSON.stringify(merged, null, 2));
  console.log('Successfully extracted and merged ' + uniqueRecords.length + ' unique records.');
} catch (e) {
  console.error('Error in script:', e);
}
