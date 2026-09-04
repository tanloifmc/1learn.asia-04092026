# INTERPRETATION SPECIFICATION

*Ngày thực hiện: 31/08/2026*

## 1. MỤC TIÊU & KIẾN TRÚC
> **[DECIDED] Nguyên tắc cốt lõi:** Dữ liệu điểm số (0-100) khô khan không thể dùng trực tiếp để hiển thị cho học sinh. Phải có một lớp diễn giải (Interpretation Rules) biến **Điểm (Score) ➔ Ý nghĩa (Meaning) ➔ Insight**. 
Lớp này hoàn toàn **Deterministic** (cố định theo rule), KHÔNG dùng AI để chế ra ý nghĩa. AI chỉ được phép dùng văn xuôi để viết lại các ý nghĩa đã được khóa cứng.

## 2. QUY TRÌNH DIỄN GIẢI (THE INTERPRETATION PIPELINE)
`Score ➔ Meaning ➔ Evidence ➔ Insight ➔ Strength ➔ Watch-out`

### Ví dụ mô phỏng 1: RIASEC (Investigative)
- **Score:** `RIASEC.I = 85` (Ngưỡng `> 70` = `High`).
- **Meaning:** `analytical_interest` (Đam mê phân tích).
- **Evidence:** "Bạn đạt điểm rất cao (85/100) ở nhóm Phân tích."
- **Insight:** "Bạn thích tìm hiểu nguyên nhân cốt lõi, thích làm việc với dữ liệu và hệ thống thay vì cảm tính."
- **Strength:** "Tư duy logic, giải quyết vấn đề phức tạp."
- **Watch-out:** "Có thể dễ bị sa đà vào chi tiết, hoặc thiếu sự linh hoạt trong môi trường cần quyết định nhanh bằng trực giác."

### Ví dụ mô phỏng 2: Big Five (Extraversion)
- **Score:** `BigFive.E = 30` (Ngưỡng `< 40` = `Low`).
- **Meaning:** `introverted_preference` (Thiên hướng Hướng nội).
- **Evidence:** "Bạn đạt điểm thấp (30/100) ở nhóm Hướng ngoại."
- **Insight:** "Bạn nạp năng lượng tốt nhất khi làm việc độc lập hoặc trong các nhóm nhỏ quen thuộc. Không khí ồn ào có thể làm bạn cạn kiệt năng lượng."
- **Strength:** "Tập trung cao độ, làm việc độc lập xuất sắc, suy nghĩ thấu đáo trước khi nói."
- **Watch-out:** "Có thể bị hiểu lầm là xa cách, cần chủ động chia sẻ ý tưởng hơn trong các cuộc họp quan trọng."

## 3. THIẾT KẾ CẤU TRÚC RULE ENGINE (PROPOSED)
> **[PROPOSED] Lớp mã hóa (Code Layer):**
Chúng ta không lưu hàng ngàn dòng text này trong Database, mà cấu trúc nó dưới dạng một bộ từ điển (JSON/TypeScript Constants) được gọi là `Interpretation Dictionary`.

```json
{
  "framework": "big_five",
  "dimension": "E",
  "rules": [
    {
      "condition": "score >= 70",
      "tags": ["highly_extroverted", "outgoing"],
      "insight": "Bạn là người hướng ngoại, thích giao tiếp và dễ dàng kết nối...",
      "strengths": ["Giao tiếp", "Khuấy động phong trào"],
      "watch_outs": ["Dễ xao nhãng", "Thiếu chiều sâu"]
    },
    {
      "condition": "score <= 40",
      "tags": ["highly_introverted", "independent"],
      "insight": "Bạn thích làm việc độc lập...",
      "strengths": ["Tập trung sâu"],
      "watch_outs": ["Cần cải thiện giao tiếp nhóm"]
    }
  ]
}
```

## 4. RÀNG BUỘC CHO AI
> **[DECIDED]** AI không bao giờ được nhận raw score (`E=30`) và tự bịa ra văn bản.
AI sẽ được nhận dữ liệu đã qua xử lý (Ví dụ: mảng các `insight`, `strengths`, `watch_outs` từ Dictionary trên) và Prompt của nó sẽ là:
*"Dựa CHÍNH XÁC vào những điểm mạnh, điểm yếu và insight sau, hãy viết một đoạn văn bản tóm tắt tự nhiên và truyền cảm hứng cho học sinh. Không được thêm thắt thông tin ngoài."*
