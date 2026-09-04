import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function seedOptions() {
  const { data: questions, error } = await supabase.from('assessment_questions').select('id');
  if (error) {
    console.error(error);
    return;
  }

  const optionsToInsert = [];
  const likert = [
    { text: "Rất không thích", value: 1 },
    { text: "Không thích", value: 2 },
    { text: "Bình thường", value: 3 },
    { text: "Thích", value: 4 },
    { text: "Rất thích", value: 5 }
  ];

  for (const q of questions) {
    for (let i = 0; i < likert.length; i++) {
      optionsToInsert.push({
        question_id: q.id,
        option_text: likert[i].text,
        option_value: likert[i].value,
        order_index: i + 1
      });
    }
  }

  // Clear existing options just in case
  await supabase.from('assessment_question_options').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { error: insertError } = await supabase.from('assessment_question_options').insert(optionsToInsert);
  if (insertError) {
    console.error(insertError);
  } else {
    console.log(`Seeded ${optionsToInsert.length} options for ${questions.length} questions.`);
  }
}

seedOptions();
