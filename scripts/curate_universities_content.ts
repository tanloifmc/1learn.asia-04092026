import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CAMPUS_IMAGES = [
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1592289658512-eb7eafcb664b?q=80&w=1980&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=2070&auto=format&fit=crop"
];

function getRandomImages(count: number = 3) {
  const shuffled = [...CAMPUS_IMAGES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

async function generateDescription(uniName: string, type: string | null): Promise<string> {
  const defaultDesc = `${uniName} là cơ sở giáo dục đại học ${type === 'public' ? 'công lập' : type === 'private' ? 'tư thục' : 'uy tín'}, cam kết mang đến môi trường học tập chất lượng cao. Trường tập trung phát triển kiến thức chuyên môn và kỹ năng thực tế, giúp sinh viên sẵn sàng đáp ứng nhu cầu của thị trường lao động.`;
  
  if (!DEEPSEEK_API_KEY) return defaultDesc;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{
          role: "system",
          content: "Bạn là trợ lý viết mô tả ngắn gọn cho các trường đại học ở Việt Nam. Chỉ viết đúng sự thật, khách quan, không phóng đại. Viết 2 câu ngắn gọn gọn gàng."
        }, {
          role: "user",
          content: `Viết 2 câu giới thiệu ngắn gọn, thực tế về "${uniName}".`
        }],
        temperature: 0.3,
        max_tokens: 150
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      return data.choices[0].message.content.trim();
    }
  } catch (e) {
    console.error(`API Error for ${uniName}:`, e);
  }
  return defaultDesc;
}

async function run() {
  console.log("Starting University Data Curation...");
  
  const { data: universities, error } = await supabase
    .from("universities")
    .select("id, name, type, description, hero_images");

  if (error || !universities) {
    console.error("Failed to fetch universities", error);
    return;
  }

  console.log(`Found ${universities.length} universities. Processing...`);

  let count = 0;
  for (const uni of universities) {
    // Skip if already fully curated
    if (uni.description && uni.hero_images && uni.hero_images.length > 0 && uni.description.length > 50 && !uni.description.includes("cam kết mang đến môi trường")) {
      continue;
    }

    const heroImages = getRandomImages(3);
    const description = await generateDescription(uni.name, uni.type);

    const { error: updateError } = await supabase
      .from("universities")
      .update({
        description,
        hero_images: heroImages,
      })
      .eq("id", uni.id);

    if (updateError) {
      console.error(`Failed to update ${uni.name}:`, updateError.message);
    } else {
      console.log(`[${++count}] Curated: ${uni.name}`);
    }
    
    // Add small delay to avoid rate limit if using API
    if (DEEPSEEK_API_KEY) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`Curation complete! Updated ${count} universities.`);
}

run();
