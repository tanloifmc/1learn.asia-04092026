const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('thông tin ngành.txt', 'utf8');
const lines = content.split('\n');

const majors = [];

let currentCode = null;
let currentFieldCode = null;
let currentField = '';

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if (!line) continue;
  
  if (line === "PHẦN II. DANH MỤC THỐNG KÊ CÁC NGÀNH ĐÀO TẠO TRÌNH ĐỘ THẠC SĨ") {
    break; // Stop at masters
  }

  // Look for 7 digit code
  if (/^\d{7}$/.test(line)) {
    currentCode = line;
  } else if (/^\d{5}$/.test(line)) {
    // 5 digit field
    currentFieldCode = line;
  } else if (currentCode) {
    majors.push({
      code: currentCode,
      name: line,
      field: currentField
    });
    currentCode = null;
  } else if (currentFieldCode) {
    currentField = line;
    currentFieldCode = null;
  }
}

console.log(`Extracted ${majors.length} majors.`);
if (majors.length > 0) {
  console.log("Sample:", majors.slice(0, 3));
  fs.writeFileSync('scratch/extracted_majors.json', JSON.stringify(majors, null, 2));
} else {
  console.log("Failed to extract using simple regex, maybe format is different?");
}
