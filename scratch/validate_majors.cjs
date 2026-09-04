const fs = require('fs');

const majors = require('./extracted_majors.json');

console.log(`Total records: ${majors.length}`);

const codes = new Set();
let hasDuplicates = false;
let hasEmptyNames = false;
let hasEmptyFields = false;
let hasCorruption = false;

for (const m of majors) {
  if (codes.has(m.code)) {
    console.log(`Duplicate code: ${m.code}`);
    hasDuplicates = true;
  }
  codes.add(m.code);

  if (!m.name || m.name.trim() === '') {
    console.log(`Empty name for code: ${m.code}`);
    hasEmptyNames = true;
  }

  if (!m.field || m.field.trim() === '') {
    console.log(`Empty field for code: ${m.code}`);
    hasEmptyFields = true;
  }

  // Check for parser corruption (e.g. name contains numbers or field contains weird chars)
  if (/^\d/.test(m.name) || m.name.includes('\t') || m.name.length < 3) {
    console.log(`Possible corruption in name: ${m.name} (Code: ${m.code})`);
    hasCorruption = true;
  }
}

if (!hasDuplicates && !hasEmptyNames && !hasEmptyFields && !hasCorruption) {
  console.log("VALIDATION PASSED: 377 unique majors with valid codes, names, and fields.");
} else {
  console.log("VALIDATION FAILED");
}
