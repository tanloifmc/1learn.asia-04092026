# 06 — AI & MATCHING SPECIFICATION
> Định nghĩa thuật toán, logic quyết định, và guardrails cho tất cả AI/Matching components.
> Không implement matching engine trước khi tài liệu này được approve.

---

## 1. Nguyên tắc cốt lõi

### 1.1 Deterministic First (DL-008 — Bất biến)

> **Kiến trúc 3 tầng cứng. Không thể thay đổi kiến trúc này mà không có quyết định từ Product Owner.**

```
Tầng 1: DETERMINISTIC ENGINE
   Input: User responses (numbers)
   Process: Pure math functions (weighted sums, dot products)
   Output: Career Profile Vector + Ranked Career List + Scores
   AI involvement: ZERO
   Guarantee: Same input = Same output, always.

Tầng 2: AI NARRATIVE LAYER
   Input: Deterministic results (immutable)
   Process: LLM writes human-readable explanation of WHY
   Output: Vietnamese text explaining the fixed results
   AI involvement: Text generation ONLY, not scoring
   Guarantee: AI changes words, not results.

Tầng 3: AI ADVISOR CHAT
   Input: Fixed deterministic results (context, cannot be overridden)
   Process: LLM answers student questions
   Output: Q&A grounded in deterministic data
   AI involvement: Q&A only
   Guarantee: AI cannot modify career recommendations.
```

**Lý do:** Nếu AI tạo ra kết quả khác nhau mỗi lần học sinh hỏi, hệ thống mất uy tín hoàn toàn. Tầng 1 là nguồn sự thật duy nhất.

### 1.2 Explainability First
Mọi output của matching engine PHẢI có giải thích. Không được trả về kết quả "black box".

### 1.3 Recommendation, không phải Diagnosis
Hệ thống KHÔNG tuyên bố "bạn sẽ là X". Hệ thống nói "dựa trên hồ sơ hiện tại, hướng X có mức độ phù hợp cao vì...".

### 1.4 Legal Safety
- Không dùng ngôn ngữ chẩn đoán ("bạn là người...", "bạn thuộc loại...")
- Luôn dùng ngôn ngữ gợi ý ("hướng này có vẻ phù hợp", "kết quả khảo sát cho thấy...")
- Disclaimer bắt buộc trên mọi kết quả: "Kết quả này dựa trên khảo sát tự báo cáo và có tính chất định hướng. Không phải kết luận tâm lý học hay y tế."

### 1.5 No Fabrication
AI KHÔNG được tự tạo dữ liệu về trường, ngành, học phí, điểm chuẩn, lương. Mọi dữ liệu thực tế phải từ database có nguồn.

---

## 2. Assessment Scoring Engine

### 2.0 Framework Overview (DL-009)

| Framework | Items | Đo gì | Dùng cho |
|---|---|---|---|
| RIASEC/Holland | 48 items (8 per type) | 6 interest types | PRIMARY career matching |
| Big Five (abbreviated) | 30 items (6 per factor) | O,C,E,A,N personality | Work style enrichment |
| Work Values (Super) | 15 items | 6 value priorities | Value alignment |
| Multiple Intelligence (Gardner) | 24 items (3 per MI) | 8 intelligence types | Ability enrichment |

**Nguồn:** openpsychometrics.org (public domain) — câu hỏi được validate khoa học, dịch và adapt sang tiếng Việt.

### 2.1 Input
```typescript
interface AssessmentSession {
  student_id: string;
  assessment_id: string;
  responses: {
    question_id: string;
    framework: 'RIASEC' | 'BigFive' | 'WorkValues' | 'Gardner';
    dimension: string; // e.g., 'R', 'I', 'O', 'income', 'linguistic'
    response_value: number | string | string[];
    weight: number; // from DB, not hardcoded
  }[];
}
```

### 2.2 RIASEC Scoring (Deterministic — no AI, no randomness)
```
FOR each RIASEC dimension d in [R, I, A, S, E, C]:

  raw_score[d] = SUM(
    response_normalized(r.value) * r.weight
    FOR each response r WHERE r.dimension = d
  ) / SUM(r.weight FOR r WHERE r.dimension = d)
  
  // Normalize to 0-100:
  final_score[d] = round(raw_score[d] * 100)

// Generate Holland Code (top 3 dimensions):
holland_code = TOP 3 dimensions by final_score, concatenated
// Example: scores = {R:72, I:85, A:43, S:38, E:61, C:29} → "IER"
```

### 2.3 Confidence Calculation
```
FOR each dimension d:
  n_items = count of questions answered for dimension d
  variance = statistical variance of responses for dimension d
  
  confidence[d] = 'HIGH'   if n_items >= 8 AND variance <= 0.25
  confidence[d] = 'MEDIUM' if n_items >= 4 AND variance <= 0.45  
  confidence[d] = 'LOW'    otherwise
```

### 2.4 Compute Student Career Profile Vector
```typescript
interface StudentCareerProfile {
  // RIASEC scores (0-100) — PRIMARY matching input
  riasec: { R: number, I: number, A: number, S: number, E: number, C: number };
  holland_code: string; // Top-3 letter code, e.g., "IAS"
  
  // Big Five (0-100)
  bigfive: { O: number, C: number, E: number, A: number, N: number };
  
  // Work Values (0-100)
  values: { income: number, stability: number, autonomy: number, creativity: number, impact: number, prestige: number };
  
  // Multiple Intelligence (0-100)
  intelligence: { linguistic: number, logical: number, spatial: number, musical: number, kinesthetic: number, interpersonal: number, intrapersonal: number, naturalistic: number };
  
  // Confidence per framework
  confidence: {
    riasec: 'high' | 'medium' | 'low';
    bigfive: 'high' | 'medium' | 'low';
    values: 'high' | 'medium' | 'low';
    intelligence: 'high' | 'medium' | 'low';
  };
  
  profile_version: number; // increments on each recalculate
  last_computed_at: string;
}
```


### 2.2 Scoring Process

**Step 1: Normalize responses**
```
scale responses (1-5) → normalized (0.0 - 1.0)
multiple_choice → map to dimension scores per question config
ranking → weighted position scores
```

**Step 2: Aggregate per dimension**
```
For each dimension (R, I, A, S, E, C for RIASEC):
  dimension_score = SUM(response_normalized * question_weight) / SUM(question_weights)
```

**Step 3: Calculate confidence**
```
confidence = HIGH   if n_questions >= 8 AND response_variance < 0.3
confidence = MEDIUM if n_questions >= 4 AND response_variance < 0.5
confidence = LOW    otherwise
```

**Step 4: Compute profile vector**
```typescript
interface StudentCareerProfile {
  // RIASEC scores (0-100)
  riasec: { R: number, I: number, A: number, S: number, E: number, C: number };
  
  // Ability scores (0-100)
  abilities: {
    logical: number, verbal: number, numerical: number,
    spatial: number, creative: number, social: number
  };
  
  // Work value priorities (0-100)
  values: {
    income: number, stability: number, autonomy: number,
    creativity: number, impact: number
  };
  
  // Work style preferences (0-100)
  work_style: { independent: number, collaborative: number };
  
  // Full profile features (Mở rộng cho tất cả evidence)
  profile_features: {
    academic_features?: Record<string, any>;
    interest_features?: Record<string, any>;
    [key: string]: any;
  };
  
  // Metadata & Versioning
  evidence_coverage: number; // 0-100%
  confidence: { [dimension: string]: 'high' | 'medium' | 'low' };
  overall_confidence: 'high' | 'medium' | 'low';
  
  profile_version: number;
  source_assessment_versions: Record<string, string>; // e.g. { riasec: "v1", bigfive: "v2" }
  last_computed_at: string;
  is_current: boolean;
}
```

### 2.5 Profile Builder Workflow
```
Assessment Complete
        ↓
Server transaction (API/RPC)
        ↓
Create / Update Derived Signals
        ↓
Profile Builder (Server-side function)
        ↓
Create Profile Version
        ↓
Trigger Matching Run (Async Job / Queue)
```
Hồ sơ học sinh (`student_career_profiles`) là một **versioned derived snapshot**. Khi có assessment mới, tạo version mới (V2) và đánh dấu `is_current = true`, giữ nguyên V1 làm lịch sử. Flow này phải được kích hoạt hoàn toàn từ Server, Frontend không được phép gọi trực tiếp hàm `computeStudentProfileVector`.

---

## 3. Career Matching Engine

### RIASEC CAREER ENCODING RULE — MVP V1

Career dataset hiện có `riasec_code` dạng Holland Code 3 chữ cái. Chuyển thành vector 6 chiều theo quy tắc cố định (Encoding kỹ thuật phục vụ cosine similarity, KHÔNG phải điểm đánh giá khoa học chuẩn quốc gia):

* Vị trí 1 = 1.0
* Vị trí 2 = 0.7
* Vị trí 3 = 0.4
* Ba nhóm RIASEC còn lại = 0

Thứ tự vector chuẩn: R, I, A, S, E, C.

**Ví dụ:**
- `ICR` => `{"R": 0.4, "I": 1.0, "A": 0, "S": 0, "E": 0, "C": 0.7}`
- `EAS` => `{"R": 0, "I": 0, "A": 0.7, "S": 0.4, "E": 1.0, "C": 0}`

### 3.1 Input
```typescript
interface MatchingInput {
  student_profile: StudentCareerProfile;
  careers: Career[]; // từ DB, status = 'published'
  student_context: {
    grade: number;
    strong_subjects: string[];
    location_preference: string;
    academic_record?: AcademicRecord[];
  };
}
```

### 3.2 Scoring Algorithm (Multi-Component Dynamic Weighting)

**Thuật toán phiên bản: MATCH-V1.0**

**Step 1: Xác định Evidence Availability (Dữ liệu hiện có)**
Kiểm tra xem student profile hiện có những component nào.
- Có RIASEC? -> Có Evidence.
- Có Ability assessment? -> Có Evidence.
- Có Work Values? -> Có Evidence.

**Step 2: Dynamic Weighting (Trọng số động)**
Công thức cơ sở lý tưởng:
`Base_Weights = { riasec: 0.40, ability: 0.25, values: 0.20, academic: 0.15 }`

Kiểm tra các components có dữ liệu thực sự (Available components).
Trọng số hiệu dụng (Effective Weight) được tính bằng công thức:
`Effective_Weight_i = Base_Weight_i / SUM(Base_Weights của các Available Components)`

Ví dụ: Nếu chỉ có dữ liệu RIASEC + Academic:
- SUM = 0.40 + 0.15 = 0.55
- `Effective_RIASEC` = 0.40 / 0.55 = 0.7273
- `Effective_Academic` = 0.15 / 0.55 = 0.2727
- `Effective_Ability` = 0
- `Effective_Values` = 0

**Step 3: Tính điểm từng Component**

*A. RIASEC Component Score*
Sử dụng Cosine Similarity giữa Vector RIASEC 6 chiều của học sinh và nghề:
`riasec_component = cosine_similarity(student.riasec_vector, career.riasec_vector) * 100`
Lưu ý: Cosine Similarity chỉ là điểm thành phần, KHÔNG PHẢI Final Match Score.

*B. Ability Component Score (Chỉ tính nếu có data)*
`ability_component = SUM(student.ability[dim] * career.weight[dim]) / SUM(career.weights)`

*C. Value Alignment Score (Chỉ tính nếu có data)*
`value_component = cosine_similarity(student.values, career.value_profile) * 100`

**Step 4: Composite Score (Độ phù hợp tổng thể)**
`match_score = (riasec_component * Effective_RIASEC) + (academic_component * Effective_Academic) + ...`
Kết quả làm tròn: 0-100.

UI gọi là "Mức độ phù hợp: 84/100 (Cao)", KHÔNG gọi là "84% phù hợp". 
Nếu `status = insufficient_data` (coverage quá thấp), hệ thống vẫn tính điểm và cho phép "Khám phá các nghề (Explore careers)", nhưng KHÔNG đưa ra kết luận "Top 10 nghề phù hợp nhất" chính thức.

**Step 5: Confidence & Coverage**
- `evidence_coverage` = Tổng Base_Weights của các components CÓ DATA / Tổng Base_Weights mong đợi (1.0). (Ví dụ: Chỉ có RIASEC -> 0.40 / 1.0 = 0.40 = 40%).
- `confidence` = Tính từ chất lượng/độ phân tán của từng component.
- Lưu ý: Confidence và Coverage được tính riêng cho từng career match, vì một nghề có thể thiếu data để so khớp academic, trong khi nghề khác thì đủ.

**Step 6: Tie-breaking Rule (Luật phân định khi bằng điểm)**
Nếu hai nghề có cùng `match_score`, thứ tự ưu tiên (sort) bắt buộc như sau:
1. `match_score` DESC
2. `confidence` DESC
3. `evidence_coverage` DESC
4. `career_code` ASC (Đảm bảo luôn deterministic)

### 3.3 Explainability Generation (Structured Data)

Explanation KHÔNG ĐƯỢC LÀ RAW TEXT do AI tự bịa. Nó phải bắt nguồn từ Data, xuất ra JSON có cấu trúc.

**Positive Factors (Điểm cộng):**
```json
{
  "factor": "investigative_tendency",
  "source": "RIASEC-v1.0",
  "student_value": 0.89,
  "career_requirement": 0.85,
  "direction": "positive",
  "magnitude": 0.04
}
```
LLM/UI sau đó mới đọc cục JSON này để dịch thành: "Tư duy khám phá là điểm tương đối phù hợp với nghề này."

**Skill Gaps vs Required Skills:**
- Sự khác biệt cực kỳ quan trọng: Nếu hệ thống CHƯA CÓ data kỹ năng của học sinh (VD: `student_skill_profile` chưa có thông tin về Python), thì KHÔNG ĐƯỢC gọi là "Skill Gaps" (bạn thiếu Python).
- Thay vào đó, gọi là **Required Skills**: "Nghề này yêu cầu kỹ năng Python (Mức độ quan trọng: Cao). Hồ sơ hiện tại chưa đánh giá được năng lực này."
- Chỉ generate "Skill Gap" thực sự khi có đủ 2 biến: `career.required_skill_level - student.current_skill_level`.

**Recommended actions:**
Dựa trên `Required Skills` hoặc `Skill Gaps` có sẵn:
- "Khám phá khóa học Python cơ bản"
- "Tìm hiểu thêm về công việc thực tế của ngành này"

### 3.4 Data Output Models

**Match Run (Lịch sử chạy Match)**
```typescript
interface MatchRun {
  id: string;
  student_id: string;
  profile_version: number;
  algorithm_version: string; // e.g., 'MATCH-V1.0'
  evidence_coverage: number;
  status: 'completed' | 'failed' | 'insufficient_data';
  started_at: string;
  completed_at: string;
}
```

**Career Match Result (Kết quả lưu theo Run)**
```typescript
interface CareerMatch {
  run_id: string;
  career_id: string;
  rank: number;
  match_score: number;        // 0-100 (Final Score)
  riasec_score: number | null;
  ability_score: number | null;
  value_score: number | null;
  academic_score: number | null;
  effective_weights: Record<string, number>; // e.g. { "riasec": 0.7273 }
  confidence: 'high' | 'medium' | 'low'; // Confidence của riêng nghề này
  evidence_coverage: number; // Tỉ lệ coverage của riêng nghề này
  factors: StructuredFactor[]; // Data JSON
  gaps: StructuredGap[];       // Data JSON (chỉ có khi có student skill data)
  required_skills: StructuredRequiredSkill[]; // Nếu chưa có skill data
}
```

**Quy tắc:**
Kết quả của `career_matches` phải luôn gắn với `run_id`. Khi chạy lại, tạo `MatchRun` mới và `career_matches` mới. 
UNIQUE constraints phải được thiết lập trong DB:
- `UNIQUE(run_id, career_id)`
- `UNIQUE(run_id, rank)`

---

## 3.5 Verification & Testing Plan
Trước khi hoàn thành Phase 4, hệ thống phải vượt qua các Test Cases sau:

1. **Deterministic Regression:**
Cùng một input profile, career dataset và `algorithm_version` phải tạo ra **cùng một output byte-for-byte/logically equivalent** (bao gồm score, rank, factors, confidence và metadata).
2. **Version Regression:**
Khi thuật toán nâng cấp (MATCH-V1.0 -> MATCH-V1.1), kết quả cũ đã tính từ V1.0 phải không bị thay đổi.
3. **Tie-breaking:**
Hai career có cùng score -> kết quả rank luôn giống nhau theo luật tie-breaking.
4. **Missing Component:**
Test các kịch bản: (RIASEC only), (RIASEC + Academic), (RIASEC + Values), (Full profile) -> expected weight phải tự động chia đúng tuyệt đối.
5. **Career Data Change:**
Nếu career vector thay đổi (version nghề đổi), match run mới phải được tạo, kết quả của run cũ phải giữ nguyên.

---

## 4. Major Matching

> [!WARNING]
> **OBSOLETE — DO NOT USE**
> This section is obsolete and MUST NOT be used for implementation.
> For Major Matching V1.0, please refer to the ONLY authoritative specification:
> `MAJOR_MATCHING_ALGORITHM_SPECIFICATION.md`
> 
> V1.0 Formula: `MajorScore = SUM(CareerMatchScore × MappingWeight) / SUM(MappingWeight)`
> MappingWeight = 1.
> Implementation: `src/features/university/actions/major-engine.ts`

---

## 5. University Matching

### 5.1 Classification Logic
```
For each (university, major) pair:

DREAM if:
  - Student's average score < university's median cutoff - 1.5 points
  - OR student doesn't meet 1+ key prerequisite

MATCH if:
  - Student's average score is within ±1 point of cutoff
  - AND student meets all prerequisites

SAFE if:
  - Student's average score > cutoff + 1.5 points
  - AND student meets all prerequisites
```

### 5.2 Required Disclaimer
```
MANDATORY on every university match display:
"Kết quả phân loại này dựa trên dữ liệu điểm chuẩn tham khảo
năm {year} và hồ sơ học tập hiện tại của bạn.
Đây là gợi ý định hướng, không đảm bảo kết quả tuyển sinh thực tế."
```

---

## 6. AI Advisor Specification

### 6.1 System Prompt Structure
```
[ROLE]
Bạn là trợ lý hướng nghiệp của 1learn.asia. Nhiệm vụ của bạn là giúp học sinh hiểu 
bản thân, khám phá nghề nghiệp, và xây dựng kế hoạch rõ ràng cho tương lai.

[CONSTRAINTS — ABSOLUTE]
- KHÔNG tự tạo thông tin về trường đại học, điểm chuẩn, học phí, mức lương.
- Nếu thiếu dữ liệu → nói rõ "tôi không có thông tin chính xác về điều này".
- KHÔNG tuyên bố "bạn sẽ phù hợp 100% với nghề X".
- KHÔNG đưa ra lời khuyên y tế, pháp lý, hoặc tài chính cụ thể.
- Luôn trích dẫn nguồn khi đưa ra số liệu.
- Khi không chắc → nói "tôi không chắc chắn, bạn nên kiểm tra lại với...".

[STUDENT CONTEXT]
{student_profile_summary}
{top_career_matches}
{current_roadmap_status}

[CONVERSATION HISTORY]
{last_10_turns}
```

### 6.2 AI Guardrails (Hard Rules)
```
FORBIDDEN OUTPUTS — reject and regenerate if detected:
1. Any definitive "you WILL become X"
2. Any fabricated admission scores
3. Any fabricated salary data without source
4. Any medical/psychological diagnosis language
5. Encouraging student to ignore parent entirely
6. Political or religious content
```

### 6.3 Retry Protocol
```
Per conversation turn:
  attempt_1: normal generation
  attempt_2: if guardrail triggered → regenerate with stricter constraints
  attempt_3: if still triggered → return safe fallback response
  
Safe fallback:
"Tôi chưa thể trả lời câu hỏi này một cách chính xác. 
Bạn có thể hỏi lại theo cách khác hoặc liên hệ tư vấn viên của chúng tôi?"
```

### 6.4 Context Window Management
```
Maximum context sent to AI:
- Student profile summary: max 500 tokens
- Top 5 career matches (not 10): max 300 tokens
- Current roadmap (summary): max 200 tokens
- Conversation history: last 10 turns, max 1500 tokens
- Current question: max 200 tokens
Total: ~2700 tokens input max
```

---

## 7. Data Freshness Rules

| Data Type | Staleness Warning After | Hard Cutoff (show unavailable) |
|---|---|---|
| Career info | 1 year | 3 years |
| University admission data | After new year's data released | 2 years |
| Major info | 2 years | 4 years |
| Salary data | 1 year | 2 years |

Warning display:
```
"Thông tin này được cập nhật lần cuối {date}. 
Một số chi tiết có thể đã thay đổi."
```

---

## 8. Matching Recalculation Triggers

Matching engine runs again when:
1. Student completes a new assessment (or retakes).
2. Student updates academic profile significantly.
3. Admin updates career data (weight/RIASEC codes changed).
4. Student manually requests recalculation.

Do NOT run on every page load — cache results per `profile_version`.

---

*Mọi thay đổi thuật toán phải được document ở đây trước khi implement.*
