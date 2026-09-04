# KẾ HOẠCH HÀNH ĐỘNG (REMEDIATION ACTION PLAN): SCORING PIPELINE
*Mục tiêu: Đưa toàn bộ hệ thống tính điểm về chuẩn Specification 100%*

Dựa trên kết quả Audit tại `01_SCORING_AUDIT_REPORT.md`, đây là kế hoạch 4 bước để khóa chặt mắt xích tính điểm trước khi đi tiếp sang giao diện Báo cáo.

---

## BƯỚC 1: XỬ LÝ LỖI TIE-BREAKING & RANKING
**File can thiệp:** `src/features/career/actions/interpretation-engine.ts`

**Hành động:**
- Viết lại logic `sort` cho **RIASEC**. Thay vì `b.score - a.score`, thêm điều kiện tie-breaker:
  - Nếu bằng điểm, ưu tiên theo thứ tự từ điển custom: `I > R > A > S > E > C`.
- Viết lại logic `sort` cho **Work Values**.
  - Nếu bằng điểm, ưu tiên theo thứ tự: `Achievement > Independence > Recognition > Relationships > Support > Working Conditions`.
- **Mục tiêu:** Đảm bảo Holland Code sinh ra luôn là Deterministic (Xác định duy nhất, không phụ thuộc trình duyệt hay thuật toán sort ngầm).

---

## BƯỚC 2: MỞ KHÓA VALIDITY & REVERSE SCORING
**File can thiệp:** `src/features/assessment/actions/scoring.ts` & Bảng `assessment_questions` (nếu cần).

**Hành động:**
- Khắc phục lỗi Hardcode `options_scale: { min: 1, max: 5 }`.
  - Phải lấy `min/max` từ Database (nếu chưa có thì phải thêm vào, hoặc config default an toàn thay vì hardcode trong hàm lõi).
- Khắc phục lỗi `UNDETERMINED` Block.
  - Sửa lại biến config `expected_answers` và `expected_duration_seconds` sao cho khớp với metadata thực tế từ Database.
  - Nếu metadata thực sự trống trong giai đoạn MVP, cần một cơ chế "Override Validity" có kiểm soát thay vì để `hasMissingMetadata = true` khóa toàn bộ hệ thống.

---

## BƯỚC 3: DỊCH CHUYỂN CLASSIFICATION VỀ BACKEND ENGINE
**File can thiệp:** `src/features/career/actions/interpretation-engine.ts` & Profile Builder.

**Hành động:**
- Hiện tại, Classification (Prominent/Moderate/Lower) đang bị tính toán bay (on-the-fly) trong lúc render Báo cáo.
- **Yêu cầu:** Gắn thẳng Classification vào `student_career_profiles` khi kết thúc bài test. Các module phía sau (Report, Matching) chỉ việc ĐỌC data, tuyệt đối không tính toán lại.

---

## BƯỚC 4: XÂY DỰNG BỘ GOLDEN TEST (BẮT BUỘC)
**File can thiệp:** `tests/golden/assessment_121_pipeline.test.ts` (Mới)

**Hành động:**
Tạo kịch bản test End-to-End từ Raw Input ra Final Profile.
- `Kịch bản 1`: Chống đánh lụi (Đánh 3 toàn bộ 121 câu -> Phải văng INVALID).
- `Kịch bản 2`: Kiểm tra Tie-break Holland Code.
- `Kịch bản 3`: Kiểm tra Big Five Prominent (Tính khoảng cách > +10 so với Mean).

---
**Trạng thái:** Chờ CTO phê duyệt kế hoạch để bắt đầu thực thi (Execution Phase).
