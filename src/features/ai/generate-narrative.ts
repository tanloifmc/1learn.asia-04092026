"use server";

/**
 * DeepSeek AI Narrative Generator
 * Generates data-grounded narrative text for student reports.
 * 
 * STRICT RULES:
 * - Only references real data passed in context. Never fabricates numbers.
 * - Output is advisory/suggestive.
 * - Always Vietnamese output.
 * - Falls back to template-based narrative if API unavailable.
 */

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

interface NarrativeInput {
  studentName: string | null;
  grade: number | null;
  hollandCode: string;           // e.g. "I · E · A"
  hollandNames: string;          // e.g. "Nghiên cứu · Quyết đoán · Sáng tạo"
  topStrengths: Array<{ name: string; score: number }>;
  developmentAreas: Array<{ name: string; score: number }>;
  topCareerName: string | null;
  topCareerScore: number | null;
  topWorkValue: string | null;
  topBigFive: string | null;
}

export interface NarrativeResult {
  headline: string;
  profileSummary: string;       // 2-3 câu mô tả hồ sơ
  strengthNarrative: string;    // 2-3 câu về điểm mạnh
  growthNarrative: string;      // 1-2 câu về vùng phát triển
  careerNarrative: string;      // 1-2 câu về gợi ý nghề nghiệp
  source: "ai" | "template";
}

export async function generateNarrative(input: NarrativeInput): Promise<NarrativeResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return buildTemplateNarrative(input);
  }

  const prompt = buildPrompt(input);

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Bạn là chuyên gia tư vấn hướng nghiệp học đường tại Việt Nam. 
Nhiệm vụ: Viết nội dung báo cáo định hướng cá nhân cho học sinh phổ thông, dựa ĐÚNG trên dữ liệu được cung cấp.

QUY TẮC BẮT BUỘC:
1. CHỈ được dùng thông tin từ dữ liệu đầu vào. Không bịa số liệu, không phán đoán tương lai.
2. Dùng ngôn ngữ GỢI Ý: "có thể", "thường phù hợp với", "xu hướng cho thấy" — KHÔNG được nói chắc chắn.
3. Văn phong: thân thiện, khích lệ, chuyên nghiệp, tiếng Việt.
4. Output: JSON hợp lệ ĐÚNG format được yêu cầu. Không thêm markdown.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("DeepSeek API error:", res.status, await res.text());
      return buildTemplateNarrative(input);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) return buildTemplateNarrative(input);

    const parsed = JSON.parse(raw);

    return {
      headline: sanitize(parsed.headline) || buildTemplateNarrative(input).headline,
      profileSummary: sanitize(parsed.profileSummary) || buildTemplateNarrative(input).profileSummary,
      strengthNarrative: sanitize(parsed.strengthNarrative) || buildTemplateNarrative(input).strengthNarrative,
      growthNarrative: sanitize(parsed.growthNarrative) || buildTemplateNarrative(input).growthNarrative,
      careerNarrative: sanitize(parsed.careerNarrative) || buildTemplateNarrative(input).careerNarrative,
      source: "ai",
    };
  } catch (err) {
    console.error("DeepSeek narrative generation failed:", err);
    return buildTemplateNarrative(input);
  }
}

function buildPrompt(input: NarrativeInput): string {
  const name = input.studentName ? `Tên: ${input.studentName}` : "Học sinh (chưa cung cấp tên)";
  const grade = input.grade ? `Lớp ${input.grade}` : "";
  const strengths = input.topStrengths.map(s => `${s.name} (điểm: ${s.score}/100)`).join(", ");
  const development = input.developmentAreas.map(d => `${d.name} (điểm: ${d.score}/100)`).join(", ");

  return `DỮ LIỆU HỌC SINH:
- ${name}, ${grade}
- Hồ sơ Holland (RIASEC): ${input.hollandCode} — ${input.hollandNames}
- Điểm mạnh nổi bật: ${strengths || "chưa có dữ liệu"}
- Vùng cần phát triển: ${development || "không có vùng yếu đáng kể"}
- Giá trị nghề nghiệp hàng đầu: ${input.topWorkValue || "chưa xác định"}
- Tính cách nổi bật (Big Five): ${input.topBigFive || "chưa xác định"}
- Nghề nghiệp gợi ý #1: ${input.topCareerName || "chưa xác định"} (độ phù hợp: ${input.topCareerScore ?? "N/A"}%)

YÊU CẦU OUTPUT (JSON):
{
  "headline": "Một câu tiêu đề súc tích, khích lệ về hồ sơ học sinh (không quá 15 từ)",
  "profileSummary": "2-3 câu mô tả hồ sơ tổng thể dựa trên Holland Code và tính cách. Dùng ngôn ngữ gợi ý.",
  "strengthNarrative": "2-3 câu về điểm mạnh cụ thể được đề cập trong dữ liệu. Nêu tên năng lực thật.",
  "growthNarrative": "1-2 câu về vùng cần đầu tư thêm, theo tinh thần tích cực/khích lệ.",
  "careerNarrative": "1-2 câu kết nối hồ sơ với gợi ý nghề nghiệp. Dùng từ 'gợi ý', 'có thể phù hợp'."
}`;
}

function sanitize(text: string | undefined | null): string {
  if (!text) return "";
  // Remove any potential hallucinated numbers or claims
  return String(text)
    .replace(/\d+%\s*(tỉ lệ|thành công|việc làm)/gi, "")
    .trim()
    .slice(0, 500); // Hard cap
}

// ── Template-based fallback (no AI) ────────────────────────────────────────────

function buildTemplateNarrative(input: NarrativeInput): NarrativeResult {
  const name = input.studentName ? `${input.studentName}` : "Bạn";
  const topStrength = input.topStrengths[0]?.name || "năng lực đa dạng";
  const topCareer = input.topCareerName || "lĩnh vực phù hợp";

  const riasecDescriptions: Record<string, string> = {
    R: "thực tiễn và ưa hành động",
    I: "phân tích và ham tìm hiểu",
    A: "sáng tạo và có tư duy nghệ thuật",
    S: "quan tâm đến con người và thích hỗ trợ cộng đồng",
    E: "năng động và có thiên hướng lãnh đạo",
    C: "có tổ chức và tư duy hệ thống",
  };

  const firstCode = input.hollandCode?.charAt(0) || "I";
  const personalityDesc = riasecDescriptions[firstCode] || "đa năng và linh hoạt";

  return {
    headline: `Hồ sơ ${input.hollandCode} — Tiềm năng trong lĩnh vực ${topCareer}`,
    profileSummary: `${name} có xu hướng ${personalityDesc}, thể hiện qua hồ sơ Holland ${input.hollandCode} (${input.hollandNames}). Kết quả này gợi ý các môi trường làm việc và học tập có thể phù hợp với cá nhân bạn.`,
    strengthNarrative: `Điểm mạnh nổi bật của bạn là "${topStrength}"${input.topStrengths[1] ? ` và "${input.topStrengths[1].name}"` : ""}. Đây là những năng lực có thể được phát huy tốt trong các ngành học và nghề nghiệp phù hợp.`,
    growthNarrative: input.developmentAreas.length > 0
      ? `Có một số vùng năng lực như "${input.developmentAreas[0].name}" có thể được đầu tư thêm để tạo lợi thế lâu dài.`
      : "Hồ sơ của bạn khá cân bằng — không có vùng nào thực sự yếu.",
    careerNarrative: `Dựa trên hồ sơ khảo sát, "${topCareer}" là một trong những lĩnh vực có thể phù hợp với bạn. Đây là gợi ý tham khảo — bạn có thể khám phá thêm các lựa chọn khác trong mục Nghề nghiệp.`,
    source: "template",
  };
}
