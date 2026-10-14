"use server";

import { CareerCatalogStatus, CareerChainItem } from "@/features/career/actions/get-premium-report-data";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const AI_REQUEST_TIMEOUT_MS = 15_000;

export interface PremiumNarrativeInput {
  studentName: string | null;
  hollandCode: string;
  hollandNames: string;
  bigFiveTraits: Array<{ name: string; score: number }>;
  workValues: Array<{ name: string; score: number }>;
  topStrengths: Array<{ name: string; score: number }>;
  careerChain: CareerChainItem[];
  careerCatalogStatus: CareerCatalogStatus;
}

export interface PremiumNarrativeResult {
  executiveSummary: {
    identityNarrative: string;
    standOuts: string;
    exploreDirection: string;
  };
  workingStyle: {
    thinking: string;
    organization: string;
    interaction: string;
  };
  crossDimensionInsights: Array<{
    title: string;
    description: string;
    formula: string; // e.g., "Artistic + Introverted"
  }>;
  actionPlan: Array<{
    milestone: string;
    task: string;
  }>;
  careerReasons: Record<string, string>; // mapping careerId -> whyItMatches narrative
}

export async function generatePremiumNarrative(input: PremiumNarrativeInput): Promise<PremiumNarrativeResult | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return buildTemplatePremiumNarrative(input);
  }

  const prompt = buildPremiumPrompt(input);

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
            content: `Bạn là chuyên gia hướng nghiệp cấp cao. Nhiệm vụ: Sinh ra báo cáo phân tích chuyên sâu (Premium Report) cho học sinh.
TUYỆT ĐỐI TUÂN THỦ:
1. Không bịa số liệu. Dựa trên dữ liệu đầu vào.
2. Output BẮT BUỘC là JSON đúng cấu trúc yêu cầu.
3. Dùng ngôn ngữ tích cực, truyền cảm hứng, khách quan.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.error("DeepSeek API error in premium:", res.status, await res.text());
      return buildTemplatePremiumNarrative(input);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) return buildTemplatePremiumNarrative(input);

    const parsed = JSON.parse(raw);
    return parsed as PremiumNarrativeResult;
  } catch (err) {
    console.error("DeepSeek premium narrative generation failed:", err);
    return buildTemplatePremiumNarrative(input);
  }
}

function buildPremiumPrompt(input: PremiumNarrativeInput): string {
  const name = input.studentName || "Học sinh";
  const b5 = input.bigFiveTraits.map(t => `${t.name}: ${t.score}`).join(", ");
  const wv = input.workValues.map(v => `${v.name}: ${v.score}`).join(", ");
  const careers = input.careerChain.map(c => `ID:${c.careerId} - ${c.careerName} (Score: ${c.matchScore})`).join(", ");

  const catalogConstraint = input.careerCatalogStatus === "insufficient"
    ? "Dữ liệu nghề-ngành-trường đã kiểm chứng hiện chưa đủ. TUYỆT ĐỐI không nêu, suy luận, hoặc khuyến nghị bất kỳ nghề, ngành, trường hay lộ trình tuyển sinh cụ thể nào. careerReasons phải là {}. exploreDirection chỉ được hướng dẫn học sinh tiếp tục khám phá thế mạnh cá nhân, không gọi tên nhóm ngành."
    : "Chỉ được thảo luận các nghề nghiệp có ID trong dữ liệu đầu vào; không bổ sung nghề, ngành, trường hoặc số liệu khác.";

  return `DỮ LIỆU:
- Tên: ${name}
- Holland: ${input.hollandCode} (${input.hollandNames})
- Big Five: ${b5}
- Giá trị nghề nghiệp: ${wv}
- Nghề nghiệp đề xuất: ${careers}

RÀNG BUỘC DỮ LIỆU: ${catalogConstraint}

YÊU CẦU OUTPUT JSON CHÍNH XÁC THEO FORMAT SAU:
{
  "executiveSummary": {
    "identityNarrative": "1 đoạn văn (khoảng 3 câu) tổng hợp sâu sắc về chân dung nghề nghiệp từ Holland và Big Five.",
    "standOuts": "1 đoạn văn nêu bật những điểm khác biệt nhất (Sự kết hợp giá trị và tính cách).",
    "exploreDirection": "1 câu khuyên học sinh nên tập trung vào nhóm ngành nào."
  },
  "workingStyle": {
    "thinking": "Dựa vào Big Five (đặc biệt Openness/Conscientiousness), mô tả cách học sinh tư duy (1 câu).",
    "organization": "Mô tả cách học sinh tổ chức công việc (1 câu).",
    "interaction": "Mô tả cách tương tác (dựa trên Extraversion/Agreeableness) (1 câu)."
  },
  "crossDimensionInsights": [
    {
      "title": "Tên pattern (VD: Người Sáng Tạo Khép Kín)",
      "description": "Giải thích vì sao sự kết hợp này đặc biệt và phát huy ở đâu.",
      "formula": "VD: Nhóm Sáng tạo (Holland A) + Nội tâm (Low Extraversion)"
    }
  ],
  "actionPlan": [
    {
      "milestone": "Tên giai đoạn (VD: Khám phá bản thân)",
      "task": "Nhiệm vụ cụ thể cần làm"
    }
  ],
  "careerReasons": {
    "<Thay bằng ID của nghề đề xuất số 1>": "1 câu giải thích ngắn gọn vì sao nghề này hợp (dựa trên Holland/Giá trị).",
    "<Thay bằng ID của nghề đề xuất số 2>": "..."
  }
}
Lưu ý: Mảng crossDimensionInsights tạo 2-3 phần tử. actionPlan tạo 3-4 phần tử lộ trình. careerReasons phải chứa chính xác các ID nghề nghiệp được truyền vào.`;
}

function buildTemplatePremiumNarrative(input: PremiumNarrativeInput): PremiumNarrativeResult {
  const careerReasons: Record<string, string> = {};
  input.careerChain.forEach(c => {
    careerReasons[c.careerId] = `Nghề ${c.careerName} phù hợp với thiên hướng ${input.hollandNames} của bạn.`;
  });

  return {
    executiveSummary: {
      identityNarrative: `Dựa trên mã Holland ${input.hollandCode}, bạn là người có thiên hướng ${input.hollandNames}.`,
      standOuts: "Bạn có sự kết hợp đặc biệt giữa tính cách và giá trị nghề nghiệp cá nhân.",
      exploreDirection: input.careerCatalogStatus === "insufficient"
        ? "Hãy tiếp tục khám phá thế mạnh cá nhân; hệ thống sẽ chỉ đề xuất nghề và ngành khi dữ liệu đã được kiểm chứng đầy đủ."
        : "Hãy tập trung khám phá các nhóm ngành liên quan đến thế mạnh chính của bạn."
    },
    workingStyle: {
      thinking: "Bạn có xu hướng tư duy logic và thực tế dựa trên dữ liệu.",
      organization: "Bạn tổ chức công việc có hệ thống và ưu tiên hoàn thành đúng hạn.",
      interaction: "Bạn tương tác tốt trong các nhóm nhỏ và tập trung vào hiệu quả."
    },
    crossDimensionInsights: [
      {
        title: "Sự kết hợp hài hoà",
        description: "Điểm giao thoa giữa sở thích và tính cách giúp bạn dễ dàng thích nghi với môi trường làm việc nhóm.",
        formula: "Holland + Big Five"
      }
    ],
    actionPlan: [
      { milestone: "Giai đoạn 1: Khám phá", task: input.careerCatalogStatus === "insufficient" ? "Ghi nhận các hoạt động học tập và trải nghiệm giúp bạn kiểm chứng thế mạnh cá nhân." : "Tìm hiểu sâu hơn về 3 nghề nghiệp đứng đầu." },
      { milestone: "Giai đoạn 2: Trải nghiệm", task: "Tham gia các khoá học hoặc hoạt động ngoại khoá liên quan." },
      { milestone: "Giai đoạn 3: Quyết định", task: "Lựa chọn ngành học và trường đại học mục tiêu." }
    ],
    careerReasons
  };
}
