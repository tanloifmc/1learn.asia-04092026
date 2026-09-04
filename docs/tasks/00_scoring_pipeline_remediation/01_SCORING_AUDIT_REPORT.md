# BÁO CÁO KIỂM TOÁN (AUDIT REPORT): SCORING PIPELINE
*Ngày thực hiện: 01/09/2026*

Sau khi đối chiếu toàn bộ luồng xử lý từ `121 responses -> scoring.ts -> interpretation-engine.ts -> report-builder.ts` với 6 file Specification lõi, hệ thống có 3 điểm lỗi (Conflict) vô cùng nghiêm trọng đe dọa trực tiếp đến tính đúng đắn của toàn bộ quy trình:

---

## 1. MAPPING 121 CÂU HỎI & SCORING RULE
**Nguồn đối chiếu:** `02_SCORING_SPECIFICATION.md`

| Item | Expected (Spec) | Actual (Code `scoring.ts`) | Status |
|---|---|---|---|
| **Số lượng câu** | 121 câu (RIASEC:36, BF:30, WV:30, CR:15, VQ:10) | Query DB thực tế trả về đúng cấu trúc này. | ✅ PASS |
| **Reverse Scoring** | Tính bằng `(max_option + min_option) - raw` (Lấy từ DB meta) | Hardcode `options_scale: { min: 1, max: 5 }` vì "DB metadata for options isn't available". | ❌ CONFLICT |
| **Weight** | Điểm = `raw * weight` | DB không có weight = null, code chạy đúng phép nhân. | ✅ PASS |
| **Formula** | Chạy `normalization_formula` từ DB. | Dùng `new Function("return " + expression)()` để parse chuỗi công thức từ DB. | ⚠️ NGUY HIỂM |

> **[Phân tích Lỗi]:** Việc hardcode `min: 1, max: 5` trong `scoring.ts` sẽ làm vỡ toàn bộ thuật toán Reverse Scoring nếu sau này đưa vào bộ câu hỏi dùng thang Likert 1-7. Code đang chống cháy thay vì tuân thủ Spec. Việc dùng `new Function()` (tương đương `eval()`) để parse công thức từ DB tiềm ẩn rủi ro bảo mật.

---

## 2. TIE-BREAKING / RANKING LOGIC (LỖI ĐẶC BIỆT NGHIÊM TRỌNG)
**Nguồn đối chiếu:** `07_INTERPRETATION_RULES_SPECIFICATION.md`

| Framework | Expected (Spec 07) | Actual (Code `interpretation-engine.ts`) | Status |
|---|---|---|---|
| **RIASEC** | Khi bằng điểm, Tie-break cố định: `I → R → A → S → E → C`. | `riasecResults.sort((a, b) => b.score - a.score)` | ❌ CONFLICT |
| **Work Values** | Khi bằng điểm hạng 3, Tie-break cố định: `Achievement → Independence → Recognition → Relationships → Support → Working Conditions`. | `wvResults.sort((a, b) => b.score - a.score)` | ❌ CONFLICT |
| **Big Five** | Không dùng Tie-break. `D >= +10` là Prominent, `D <= -10` là Lower. Lấy trait có D lớn nhất làm "Nổi bật nhất". | Xử lý Mean và D đúng threshold `+10` / `-10`. | ✅ PASS |

> **[Phân tích Lỗi]:** Hàm `sort` của JavaScript chỉ sắp xếp theo điểm. Nếu 2 nhóm RIASEC cùng đạt 28 điểm, thứ tự sẽ rơi vào trạng thái Arbitrary (hên xui tùy theo thứ tự push vào mảng). Việc mất cơ chế Tie-break khiến **Holland Code sinh ra bị sai**, dẫn đến toàn bộ Identity và AI Matching phía sau bị chệch hướng hoàn toàn.

---

## 3. VALIDITY DOWNSTREAM IMPACT (LỖI CHẶN HỆ THỐNG)
**Nguồn đối chiếu:** `08_VALIDITY_SPECIFICATION.md`

| Quy tắc | Expected (Spec 08) | Actual (Code `scoring.ts` & `report-builder.ts`) | Status |
|---|---|---|---|
| **Thiếu Metadata** | Đánh giá là `UNDETERMINED`. | `hasMissingMetadata = true` ➔ `UNDETERMINED`. | ✅ PASS |
| **Attention Check** | Đếm lỗi sai so với `expected_answers`. | Pass hardcode `expected_answers: {}` ➔ Luôn 0 lỗi. | ❌ CONFLICT |
| **Khóa Report** | `UNDETERMINED` thì Không tạo/Không hiển thị Report. | `if (validity === 'UNDETERMINED') throw new ReportBlockedError` | ✅ PASS |

> **[Phân tích Lỗi - HỆ QUẢ DÂY CHUYỀN]:** 
> 1. Vì `scoring.ts` đang bị hardcode chặn `expected_answers: {}` và không truyền `expected_duration_seconds`.
> 2. Nên `hasMissingMetadata` luôn luôn `TRUE`.
> 3. Hệ thống luôn luôn chấm bài là `UNDETERMINED`.
> 4. `report-builder.ts` luôn luôn ném lỗi `ReportBlockedError('UNDETERMINED')`.
> **Kết luận:** 100% học sinh sau khi làm xong 121 câu sẽ bị **trắng trang báo cáo hoặc văng lỗi 500** do bị khóa bởi Validity Gate!

---

## 4. RAW -> NORMALIZED -> CLASSIFICATION
**Nguồn đối chiếu:** `03_UNIFIED_PROFILE_SPECIFICATION.md`

- **Raw to Normalized:** Đã thực hiện tại `scoring.ts`.
- **Normalized to Classification:** Thực hiện tại `interpretation-engine.ts`.
- **Conflict:** Thay vì lưu classification (Prominent/Moderate/Lower) thẳng vào `student_career_profiles` như một Data Contract vững chắc, Backend lại để nguyên điểm số và ném cho Frontend / Report Builder tự map lại thành chuỗi Text trong quá trình build report. Điều này vi phạm nguyên tắc tách biệt Data vs Presentation.

---

## 5. GOLDEN TEST (ĐỀ XUẤT)
Hiện tại source code **KHÔNG CÓ Golden Test**. Các test case hiện tại trong `remediation.test.ts` hoặc `real-pipeline.test.ts` chỉ test các function rời rạc, hoặc mock dữ liệu giả, không test end-to-end 121 câu.

**Kế hoạch Golden Test bắt buộc:**
Chúng ta cần tạo 1 file `tests/golden/assessment_121_pipeline.test.ts`.
1. **Mock Input:** Một mảng JSON chứa chính xác 121 object `{ question_code, response_value }`.
2. **Kịch bản 1 (The Straight-liner):** Cho 121 câu trả lời là 3. Phải văng cờ `INVALID` vì dính Straight-line block. Report bị chặn.
3. **Kịch bản 2 (The Tied Holland):** Cấp điểm sao cho I và R bằng điểm nhau. Chạy qua hệ thống, Holland Code TRẢ VỀ BẮT BUỘC PHẢI LÀ `IR...` chứ không được là `RI...`.
4. **Kịch bản 3 (The Extreme Personality):** Cấp điểm để O cách biệt trung bình +15 điểm. Output bắt buộc `O: PROMINENT`.
