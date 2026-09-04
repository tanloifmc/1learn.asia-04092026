# EXECUTIVE SNAPSHOT SPECIFICATION (DRAFT)

*Trạng thái: PENDING PO APPROVAL / DESIGN PHASE*
*Tài liệu này xác định các quy tắc kinh doanh (business rules) để tổng hợp "Executive Snapshot" (Bản Tóm tắt Cá nhân) cho Free Report.*

## 1. MỤC TIÊU
- Định nghĩa rõ ràng quy tắc cấu trúc các câu (assembly rules) tạo thành `deterministicSummary`.
- Đảm bảo mỗi câu đều có provenance rõ ràng, không hardcode, không tự suy diễn narrative ngoài dữ liệu thực.

## 2. QUY TẮC CẤU TRÚC (ASSEMBLY RULES)

Executive Snapshot sẽ gồm từ **1 đến 3 câu** tùy thuộc vào dữ liệu thực tế có sẵn. Đây là mảng câu được lắp ghép dựa trên 3 khối dữ liệu cốt lõi:

### Câu 1: Identity (Định dạng Bản thân)
- **Nguồn (Source):** `hollandCode` (Top 3 RIASEC, ví dụ: "IRE") và `RIASEC_IDENTITY_LABELS` (từ `presentation-dictionary.ts`).
- **Dữ liệu bắt buộc:** Phải có `hollandCode` hợp lệ.
- **Rule (Ưu tiên):** 
  - Tra cứu Identity Label cho **đúng tổ hợp 3 chữ cái** của `hollandCode` (VD: lookup `IRE`).
  - **Fallback:** Nếu dictionary không định nghĩa nhãn cho tổ hợp 3 chữ cái đó, thì fallback về **chữ cái đầu tiên (Primary code)** (VD: fallback về `I`).
- **Output:** `"Bạn là một [Identity Label] (nhóm [Holland Code])."`
- **Ví dụ:** `"Bạn là một Người Khám Phá - Phân Tích (nhóm IRE)."`
- **Fallback / Empty Behavior:** Nếu không có dữ liệu Holland Code hợp lệ → Bỏ qua câu này.

### Câu 2: Personality (Đặc trưng Tính cách)
- **Nguồn (Source):** `interpreted.personality` (đã qua engine phân tích).
- **Dữ liệu bắt buộc:** Chỉ xét các trait có `level === 'prominent'` (Tức là khoảng cách `D >= +10` theo Spec 07).
- **Rule:** 
  - Nếu có 1 hoặc nhiều trait `prominent`, chọn trait có điểm `score` cao nhất làm Primary Prominent Trait.
  - Lấy `meaning` của trait này (VD: "Sự cởi mở với trải nghiệm mới").
- **Output:** `"Trong hồ sơ tính cách, [Meaning] là điểm đặc trưng nổi bật nhất của bạn."`
- **Ví dụ:** `"Trong hồ sơ tính cách, sự cởi mở với trải nghiệm mới là điểm đặc trưng nổi bật nhất của bạn."`
- **Fallback / Empty Behavior:** Nếu KHÔNG CÓ trait nào đạt mức `prominent` → Bỏ qua câu này hoàn toàn.

### Câu 3: Core Work Value (Giá trị Cốt lõi)
- **Nguồn (Source):** `interpreted.work_values` (đã qua engine phân loại và rank).
- **Dữ liệu bắt buộc:** Lấy Work Value đứng thứ 1 (`rank === 1`).
- **Rule:** Lấy tên tiếng Việt của giá trị này.
- **Output:** `"Trong công việc, bạn ưu tiên nhất là [Work Value Name]."`
- **Ví dụ:** `"Trong công việc, bạn ưu tiên nhất là Sự Độc Lập."`
- **Fallback / Empty Behavior:** Nếu không có dữ liệu Work Value → Bỏ qua câu này.

## 3. PROVENANCE TRACEABILITY
- **Câu 1:** Score → Ranking → Top 1 → Presentation Dictionary → Câu 1.
- **Câu 2:** Score → Mean(Score) → Distance(D) → Prominent (>10) → Max(Prominent) → Interpretation Dictionary (Meaning) → Câu 2.
- **Câu 3:** Score → Ranking → Top 1 → Framework Code → Câu 3.

## 4. UNIT TEST CASES YÊU CẦU
- **TC1 (Full):** Có đủ Identity, 1 Prominent Trait, 1 Work Value → Trả về mảng 3 câu.
- **TC2 (No Prominent):** Các trait đều Moderate/Lower → Trả về mảng 2 câu (Identity, Work Value).
- **TC3 (Missing Data):** Report bị invalid hoặc không đủ dimension → Xử lý ném lỗi ở Engine trước khi tới Builder.

## 5. LỘ TRÌNH THỰC THI (SAU KHI CHỐT SPEC)
1. Cập nhật Spec này thành **FINAL LOCKED**.
2. Code hàm `buildDeterministicExecutiveSnapshot` trong `report-builder.ts` tuân thủ 100% logic trên.
3. Chạy Unit Test kiểm chứng.
