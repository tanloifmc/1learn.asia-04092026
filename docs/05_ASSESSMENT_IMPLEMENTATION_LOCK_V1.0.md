# 1learn.asia — ASSESSMENT IMPLEMENTATION LOCK V1.0

## Mục tiêu
Tài liệu này là "hàng rào" cho developer/Antigravity.
Developer không được tự diễn giải lại assessment.

Nguồn sự thật theo thứ tự:
1. ASSESSMENT_QUESTION_BANK_V1.0.json
2. ASSESSMENT_SCORING_MATRIX_V1.0.md
3. Database schema/migration đã được CTO phê duyệt
4. Code implementation

Nếu code khác specification, code sai, không phải specification sai.

## 1. Luồng dữ liệu bắt buộc
Student
  ↓
assessment_sessions
  ↓
assessment_responses
  ↓
Assessment Scoring Engine
  ↓
assessment_results
  ↓
assessment_result_dimensions
  ↓
derived_profile_signals
  ↓
Career Matching Engine
  ↓
career_matches
  ↓
Major / University
  ↓
Gap Analysis
  ↓
Roadmap

## 2. Progressive Assessment
UI hiện tại của sản phẩm đã xác định assessment là 4 chặng.
Không được bắt buộc học sinh làm lại toàn bộ từ đầu nếu đã lưu response.

Mỗi câu trả lời:
- auto-save;
- có timestamp;
- có session_id;
- có question_id;
- có version_id.

QuestionCard:
- 1 câu/màn hình;
- 5 lựa chọn;
- progress rõ ràng;
- không hiển thị tên framework kỹ thuật cho học sinh.

## 3. Framework names trong UI
**Backend:**
- RIASEC
- Big Five
- Work Values
- Career Readiness

**UI học sinh:**
- RIASEC: "Em nhìn thế giới như thế nào?"
- Big Five: "Em là người như thế nào?"
- Work Values: "Điều gì quan trọng với em?"
- Career Readiness: "Em đã sẵn sàng đến đâu?"

Không hiển thị: "Neuroticism", "Conscientiousness", "RIASEC code" như nhãn kỹ thuật trong màn hình làm bài.

## 4. Không hardcode question data trong frontend
Frontend MUST query published assessment version.
Nguồn: `assessment_questions` JOIN `assessment_question_options`
filter: `version_id = publishedVersionId`

Question text và options không được hardcode vào component.
Question Bank JSON là source để seed/import dữ liệu DB.

## 5. Database contract
Sử dụng các bảng hiện có của Phase 2:
- assessment_versions
- assessment_dimensions
- assessment_questions
- assessment_question_options
- assessment_sessions
- assessment_responses
- assessment_results
- assessment_result_dimensions

Không tạo bảng thay thế chỉ vì developer thấy thuận tiện.
Nếu schema hiện tại có tên/cột khác với tài liệu này: dừng migration; audit schema; cập nhật specification; tăng version nếu logic thay đổi.

## 6. RLS
Student chỉ được:
- tạo session của chính mình;
- đọc session của chính mình;
- ghi response của chính mình;
- đọc result của chính mình.

Student KHÔNG được:
- sửa score;
- sửa normalized_score;
- sửa confidence;
- sửa career match;
- thay đổi assessment_version.

Score/result phải do server-side engine tạo.

## 7. Result report contract
Report `/me/bao-cao` lấy dữ liệu thật:
- assessment_results
- assessment_result_dimensions
- assessment_dimensions
- derived_profile_signals
- career_matches
- match_explanations

Không hardcode kết quả mẫu.

## 8. "Chưa đủ dữ liệu"
Report luôn phải trung thực.
Assessment không cung cấp: điểm học tập; kỹ năng thực tế; hoạt động ngoại khóa; kinh nghiệm; điều kiện gia đình; sở thích đã thay đổi theo thời gian.
Vì vậy không được biến assessment thành tuyên bố toàn diện về con người.
Nếu thiếu dữ liệu: "Hệ thống chưa có đủ dữ liệu để kết luận phần này."

## 9. Separation from Phase 6
Assessment KHÔNG tạo skill gap.
Đã khóa quyết định: RIASEC / Big Five / Work Values = xu hướng/sở thích/bối cảnh.
Không phải: skill proficiency.
Skill gap của roadmap phải đi từ: `academic_records` -> `target_requirements` và các evidence sources được Phase 6 cho phép.

## 10. Matching boundary
**Assessment Engine:**
- INPUT: 121 responses
- OUTPUT: Student Career Profile

**Matching Engine:**
- INPUT: Student Career Profile + Career profiles + Ability evidence + Confidence
- OUTPUT: career_matches

Không nhập nhằng hai engine.

## 11. No AI scoring
AI/LLM may help with: language presentation; explanation templates if explicitly approved; conversational follow-up.
AI/LLM may NOT: score; normalize; rank dimensions; rank careers; alter confidence; invent missing evidence; override deterministic engine output.

## 12. Publish lifecycle
Assessment version lifecycle: DRAFT -> VALIDATING -> PUBLISHED -> RETIRED
Only one version is PUBLISHED for the active student flow.
Published version is immutable.

## 13. Migration gate
No migration is considered complete until the Phase 2 pre-flight verifies: final schema; scoring formulas; RLS matrix; lifecycle; data flow; seed/import data; unit tests; E2E tests; Definition of Done.
This is consistent with the existing Phase 2 governance rule: no migration before pre-flight approval.

## 14. Final implementation instruction
The developer's job is: "Implement the specification."
The developer's job is NOT: "Improve the assessment logic."
Any proposed improvement must be submitted separately as: ASSESSMENT_CHANGE_PROPOSAL and cannot be merged into V1.0 without product/CTO approval.

END — IMPLEMENTATION LOCK V1.0
