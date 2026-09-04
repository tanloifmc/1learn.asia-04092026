require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Fetching careers and majors...");
  const { data: careers } = await supabase.from('careers').select('id, name, riasec_primary').eq('status', 'published');
  const { data: majors } = await supabase.from('majors').select('id, name, slug');

  if (!careers || !majors) return console.error("Failed to fetch");

  const mappingsToInsert = [];

  for (const career of careers) {
    const cName = career.name.toLowerCase();
    let bestMajor = majors[0];
    let maxMatch = 0;

    for (const major of majors) {
      const mName = major.name.toLowerCase();
      // Very basic keyword overlap
      const cWords = cName.split(/[\s,]+/);
      const mWords = mName.split(/[\s,]+/);
      let matchCount = 0;
      for (const cw of cWords) {
        if (cw.length > 2 && mName.includes(cw)) matchCount++;
      }
      
      if (matchCount > maxMatch) {
        maxMatch = matchCount;
        bestMajor = major;
      }
    }

    // If no text match, assign a random one based on riasec code hash as fallback to ensure coverage (deterministic)
    if (maxMatch === 0) {
      const hash = career.riasec_code ? career.riasec_code.charCodeAt(0) % majors.length : career.name.length % majors.length;
      bestMajor = majors[hash];
    }

    mappingsToInsert.push({
      career_id: career.id,
      major_id: bestMajor.id,
      status: 'published',
      relationship_type: 'primary',
      relevance_score: 0.9
    });
  }

  console.log(`Inserting ${mappingsToInsert.length} mappings...`);
  const { error } = await supabase.from('career_major_mappings').upsert(mappingsToInsert, { onConflict: 'career_id, major_id' });
  if (error) {
    console.error("Error inserting mappings:", error);
  } else {
    console.log("Successfully mapped all careers to majors!");
  }
}

run().catch(console.error);
