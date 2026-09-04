# SCORING ENGINE SPECIFICATION

*Ngày thực hiện: 31/08/2026*

## 1. MỤC TIÊU & KIẾN TRÚC CHUNG
> **[DECIDED] Thiết kế lõi:** Engine chấm điểm phải là một hệ thống thiết kế mở (Agnostic). Tức là, nó không được phép hard-code cứng cho bài 121 câu hay RIASEC. Bất kỳ bài test nào trong tương lai (Ví dụ: Trắc nghiệm MBTI 40 câu) nếu đáp ứng đủ schema, đều có thể bơm vào hệ thống và được chấm điểm tự động.

## 2. PIPELINE CHẤM ĐIỂM (THE SCORING PIPELINE)
> **[PROPOSED] Data Flow Tuyến tính:**
`Assessment Session ➔ Raw Answers ➔ Scoring Engine ➔ Dimension Scores ➔ Assessment Result`

### Bước 1: Thu thập Raw Answers
- Khi một `assessment_session` hoàn thành, hệ thống có một mảng các `assessment_responses` (câu trả lời thô: VD: value = 1..5).

### Bước 2: Nhóm theo Dimension
- Hệ thống join `assessment_responses` với `assessment_questions` để biết câu trả lời đó thuộc `dimension_id` nào.
- Xử lý câu hỏi đảo ngược (`is_reverse_scored = true`):
  - *Công thức:* `adjusted_value = (max_option_value + min_option_value) - raw_value`
- Tính `raw_score` của từng Dimension bằng cách sum toàn bộ `adjusted_value` (sau khi đã nhân với `weight` nếu có).

### Bước 3: Chuẩn hóa (Normalization)
- Sử dụng trực tiếp trường `normalization_formula` trong bảng `assessment_dimensions` để biên dịch điểm (tránh hardcode công thức trong mã nguồn).
- *Ví dụ Formula được parse:* `((raw - raw_min) / (raw_max - raw_min)) * 100`.
- Output: `normalized_score` (Thang 0-100).

### Bước 4: Lưu trữ Assessment Result
- Tạo bản ghi mới trong `assessment_results` liên kết với Session.
- Lưu toàn bộ điểm chuẩn hóa vào `assessment_result_dimensions`.

## 3. XỬ LÝ VALIDITY (ĐỘ TIN CẬY)
> **[DECIDED]** Cơ chế kiểm tra gian lận/đánh lụi.
- Framework Validity (Ví dụ: Dimension VQ) không dùng để tạo Profile cá nhân, mà dùng làm Gatekeeper.
- Nếu `VQ score < ngưỡng cho phép` ➔ Đánh dấu `assessment_results.is_valid = false`.
- *Quy tắc:* Các bài test `is_valid = false` KHÔNG được phép đưa vào Unified Profile hay Matching.

## 4. KHẢ NĂNG MỞ RỘNG (EXTENSIBILITY)
> **[DECIDED]** 
- Khi thêm bài test mới, Admin chỉ việc định nghĩa cấu hình vào 3 bảng `assessments`, `assessment_dimensions` (kèm formula), và `assessment_questions`.
- Engine chấm điểm tự động lấy Formula ra tính toán, hoàn toàn không cần sửa một dòng code BE nào.
