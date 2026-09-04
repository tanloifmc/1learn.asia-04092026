const fs = require('fs');

const rawMajors = require('./extracted_majors.json');

const slugMap = new Map();
const duplicates = [];

rawMajors.forEach(m => {
    const slug = m.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    if (slugMap.has(slug)) {
        duplicates.push({ name: m.name, slug, originalName: slugMap.get(slug).name });
    } else {
        slugMap.set(slug, m);
    }
});

console.log(`Duplicate slugs:`, duplicates);
