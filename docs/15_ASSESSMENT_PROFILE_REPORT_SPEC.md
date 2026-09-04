# KIẾN TRÚC ASSESSMENT → PROFILE → REPORT → CAREER (V1.0)

Tài liệu này được lập ra nhằm tái định hình lại kiến trúc sản phẩm, chuyển từ mô hình "1 Assessment -> Matching" (đơn tuyến) sang mô hình đa lớp "Multiple Assessments -> Unified Profile -> Self-Discovery Report -> Multi-layered Matching" (đa tuyến) theo định hướng của Product Owner.

---

## PHẦN 1. AUDIT THỰC TRẠNG (AS-IS)

### 1. "121 câu hiện tại" thực sự đo những gì?
Qua quá trình query trực tiếp database (bảng `assessment_dimensions` và `assessment_questions` của bài test `1learn_career_exploration`), tôi phát hiện rằng 121 câu hỏi này **không chỉ đo mỗi RIASEC**. Thực chất, đây là một bài kiểm tra **TỔNG HỢP 5 TRONG 1**, bao gồm 19 dimensions thuộc 5 Frameworks:

1. **RIASEC (Sở thích nghề nghiệp):** R, I, A, S, E, C (Top matching signal).
2. **Big Five (Tính cách):** Cởi mở (O), Tận tâm (C), Hướng ngoại (E), Dễ chịu (A), Ổn định cảm xúc (N).
3. **Work Values (Giá trị nghề nghiệp):** Thành tựu, Tự chủ, Ghi nhận, Quan hệ, Hỗ trợ, Điều kiện làm việc.
4. **Career Readiness (Mức độ sẵn sàng):** CR (Đã bắt đầu lên kế hoạch chưa?).
5. **Validity (Độ tin cậy):** VQ (Câu hỏi bẫy để xem học sinh có đánh lụi không).

### 2. Mỗi phương pháp tạo ra output gì?
Dữ liệu đang được chấm điểm bằng công thức: `((raw - min) / (max - min)) * 100`. Output hiện tại là các điểm số chuẩn hóa từ 0-100 cho từng dimension. Tuy nhiên, chúng đang nằm rời rạc trong `assessment_result_dimensions` thay vì kết nối thành một câu chuyện.

### 3. Student Profile đang lưu trữ gì?
Bảng `student_career_profiles` lưu một trường JSONB `profile_features`. Hiện tại nó chỉ là một cái "kho" chứa tất cả các điểm số được tống vào, **chưa hề có logic hợp nhất hay giải nghĩa**. 

### 4. Matching Engine đang sử dụng gì?
**ĐÂY LÀ LỖI KIẾN TRÚC LỚN NHẤT:** Dù bài test đã vất vả lấy 121 câu hỏi để đo cả Big Five và Work Values, nhưng hàm `cosineSimilarity` trong `matching-engine.ts` hiện tại **CHỈ BÓC MỖI VECTOR RIASEC 6 CHIỀU RA ĐỂ MATCHING VỚI CAREER.** Toàn bộ tính cách và giá trị nghề nghiệp (MBTI/Big Five, Work Values) đang bị **vứt bỏ** trong thuật toán gợi ý nghề.

---

## PHẦN 2. ĐỀ XUẤT KIẾN TRÚC MỚI (TO-BE)

Để giải quyết vấn đề hệ thống quá phụ thuộc vào RIASEC và cung cấp cho học sinh trải nghiệm Khám phá bản thân thay vì chỉ "Trả kết quả", dưới đây là 4 tầng kiến trúc được đề xuất khóa lại cho MVP:

### Tầng 1: ĐẦU VÀO (Input)
Hệ thống chấp nhận **nhiều nguồn đánh giá độc lập**, có thể làm ở các thời điểm khác nhau.
- `Assessment 1 (121 câu)` ➔ Tính cách, Sở thích, Giá trị làm việc.
- `Assessment 2 (Trong tương lai)` ➔ Năng lực học tập, Khảo sát thị trường.

### Tầng 2: TRUNG TÂM HỒ SƠ (Student Career Profile)
Các bài test xong sẽ không đưa ra nghề ngay. Mọi điểm số (Dimensions) sẽ được gộp vào `student_career_profiles.profile_features`.
- Hệ thống sẽ chạy một bộ **Profile Builder** (Quy tắc diễn giải).
- *Ví dụ:* Nếu Điểm Hướng ngoại (Big 5: E) > 70 và Điểm Xã hội (RIASEC: S) > 70 ➔ Gắn thẻ tag: `Giao tiếp tốt`, `Môi trường năng động`.

### Tầng 3: BÁO CÁO KHÁM PHÁ BẢN THÂN (Self-Discovery Report)
Đây là màn hình `/assessment/results` mà học sinh nhìn thấy. Cấu trúc hiển thị UI/UX:
1. **Chân dung tổng quan:** Bạn là người Khám phá - Phân tích (Nhóm I).
2. **Sở thích & Xu hướng:** Phân tích logic RIASEC.
3. **Cách bạn làm việc:** Phân tích Big Five (Làm việc nhóm hay Độc lập).
4. **Giá trị nghề nghiệp:** Bạn coi trọng Sự tự chủ và Thăng tiến.
5. **Điểm mạnh / Điểm cần lưu ý.**
*(Đến đây, học sinh đã hiểu mình là ai. Sau đó mới hiển thị mục 6).*
6. **Nhóm nghề nên khám phá:** Chuyển hướng sang Career.

### Tầng 4: MATCHING ENGINE ĐA LỚP
Không dùng riêng RIASEC để đẩy ra điểm tổng, vì không có cơ sở khoa học để cộng điểm RIASEC với Big Five.
**Kiến trúc Matching mới:**
- **Primary Signal (Tầng 1 - Sàng lọc):** `cosine_similarity(Student.RIASEC, Career.RIASEC)`. Dùng để thu hẹp 161 nghề xuống top 20 nghề có sở thích phù hợp nhất.
- **Secondary Constraints (Tầng 2 - Xếp hạng):** Sử dụng Big Five và Work Values của học sinh làm bộ lọc (Filter/Sorter). 
  - *Ví dụ:* Nghề Lập trình (ICR) và Phân tích Dữ liệu (ICR) có cùng RIASEC. Nhưng học sinh có `Work Value = Independence (Tự chủ)` cao, thì Lập trình tự do (Freelance Dev) sẽ xếp trên. Học sinh có `Big Five E (Hướng ngoại)` cao thì Kỹ sư giải pháp (Solution Architect - hay đi họp) sẽ xếp trên.

---

## PHẦN 3. CÁC ĐIỂM CHƯA ĐƯỢC QUYẾT ĐỊNH (CẦN PRODUCT OWNER CHỐT)

**1. Công thức Mapping Text cho Profile:** 
Chúng ta chưa có các đoạn văn bản giải thích. (Ví dụ: `I > 70` thì in ra câu gì lên Báo cáo?). Cần có bộ dữ liệu nội dung này.

**2. Tiêu chí cho Tầng 2 Matching (Secondary Constraints):**
Trong 161 nghề hiện tại, dataset của Perplexity **chưa có các metadata** về MBTI, Big Five hay Work Values cho từng nghề. Nếu học sinh có Big Five, nhưng Nghề không có Big Five thì không thể đối chiếu Tầng 2. 
- *Cách giải quyết cho MVP:* Tạm thời MVP V1 vẫn chạy Matching Tầng 1 (RIASEC) để ra danh sách nghề. Big Five và Work Values tạm thời chỉ dùng để in ra "Báo cáo khám phá bản thân" ở Tầng 3 cho học sinh đọc, CHƯA đưa vào thuật toán vội.

---
*(Tài liệu này được tạo dựa trên kết quả audit ngày 31/08/2026).*
