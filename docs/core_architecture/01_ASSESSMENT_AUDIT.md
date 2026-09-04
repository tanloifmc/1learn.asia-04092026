# ASSESSMENT AUDIT & DATA CONTRACT

*Ngày thực hiện: 31/08/2026*

## 1. TỔNG QUAN HỆ THỐNG HIỆN TẠI (AS-IS)

Hệ thống Assessment hiện tại chứa 2 gói đánh giá, trong đó gói chính đang vận hành là `1learn_career_exploration` (Gồm 121 câu hỏi). 

> **[DECIDED] Nguyên tắc lõi:** 121 câu hiện tại chỉ là MỘT *Assessment Package*. Hệ thống được thiết kế để hỗ trợ vô số Assessment Packages độc lập (Ví dụ: Bài test IQ riêng, Bài test Năng lực riêng) trong tương lai.

## 2. AUDIT: 1LEARN_CAREER_EXPLORATION PACKAGE

Dựa trên dữ liệu thực tế trong DB, bài khảo sát 121 câu là một gói tổng hợp (5-in-1), đo lường 19 Dimensions thuộc 5 Frameworks khác nhau.

### 2.1 Framework 1: RIASEC (Sở thích nghề nghiệp)
- **Trạng thái:** `EXISTING`
- **Matching Role:** `primary`
- **Dimensions (6):** 
  - Thực hành - Realistic (R)
  - Phân tích - Investigative (I)
  - Sáng tạo - Artistic (A)
  - Xã hội - Social (S)
  - Lãnh đạo - Enterprising (E)
  - Tổ chức - Conventional (C)
- **Scoring (Quy tắc):**
  - `raw_min`: 6
  - `raw_max`: 30
  - `normalization_formula`: `((raw - 6) / 24) * 100`

### 2.2 Framework 2: Big Five (Tính cách)
- **Trạng thái:** `EXISTING`
- **Matching Role:** `secondary`
- **Dimensions (5):**
  - Cởi mở - Openness (BF_O)
  - Tận tâm - Conscientiousness (BF_C)
  - Hướng ngoại - Extraversion (BF_E)
  - Dễ chịu - Agreeableness (BF_A)
  - Ổn định cảm xúc - Emotional Stability (BF_N)
- **Scoring (Quy tắc):**
  - `raw_min`: 6
  - `raw_max`: 30
  - `normalization_formula`: `((raw - 6) / 24) * 100`

### 2.3 Framework 3: Work Values (Giá trị nghề nghiệp)
- **Trạng thái:** `EXISTING`
- **Matching Role:** `secondary`
- **Dimensions (6):**
  - Thành tựu (WV_ACHIEVEMENT)
  - Tự chủ (WV_INDEPENDENCE)
  - Ghi nhận (WV_RECOGNITION)
  - Quan hệ (WV_RELATIONSHIPS)
  - Hỗ trợ (WV_SUPPORT)
  - Điều kiện làm việc (WV_CONDITIONS)
- **Scoring (Quy tắc):**
  - `raw_min`: 5
  - `raw_max`: 25
  - `normalization_formula`: `((raw - 5) / 20) * 100`

### 2.4 Framework 4: Career Readiness (Sẵn sàng khám phá)
- **Trạng thái:** `EXISTING`
- **Matching Role:** `readiness`
- **Dimensions (1):**
  - Mức độ chuẩn bị (CR)
- **Scoring (Quy tắc):**
  - `raw_min`: 15
  - `raw_max`: 75
  - `normalization_formula`: `((raw - 15) / 60) * 100`

### 2.5 Framework 5: Validity (Kiểm soát chất lượng)
- **Trạng thái:** `EXISTING`
- **Matching Role:** `quality`
- **Dimensions (1):**
  - Chú ý & Nhất quán (VQ)
- **Scoring (Quy tắc):** (Khác biệt)
  - Không có `raw_min`/`raw_max` hoặc chuẩn hóa 0-100.
  - Phụ thuộc vào thuật toán bẫy. (Sẽ xử lý riêng tại Engine).

## 3. VẤN ĐỀ VÀ BLOCKER (ĐÃ XÁC ĐỊNH)
- Điểm hợp nhất hiện tại nạp thẳng vào `student_career_profiles` mà không phân loại (Mix lẫn lộn RIASEC với Big Five).
- Lớp báo cáo tự bóp gọn vào `cosineSimilarity` chỉ sử dụng 6 chiều của RIASEC, vứt bỏ toàn bộ tính cách và giá trị.
