# KẾ HOẠCH TRIỂN KHAI STEP 6.5: HOÀN THIỆN FREE REPORT UX

## 1. MỤC TIÊU (GOAL)
Hoàn thành 100% Trải nghiệm Khám phá bản thân (Self-Discovery Experience) cho Free Report theo đúng `REPORT_UI_UX_BLUEPRINT`.
Dịch chuyển giao diện từ "Báo cáo dữ liệu khô khan" (Technical UI) sang "Câu chuyện cá nhân" (Personalized Narrative).

## 2. PHẠM VI CÔNG VIỆC (SCOPE)

### 2.1. Nâng cấp Career Identity Card (Hero Section)
- **Tệp cần sửa**: `src/app/assessment/[id]/result/components/cards/CareerIdentityCard.tsx`
- **Công việc**:
  - Tái cấu trúc layout để tạo Wow Moment (Hero banner).
  - Bổ sung hệ thống Typography lớn cho Identity Title.
  - Hiển thị rõ Holland Code (Primary & Secondary type).
  - Đảm bảo hiển thị Narrative giải thích rõ ràng và truyền cảm hứng.

### 2.2. Nâng cấp RIASEC Profile Card (Insight Layer)
- **Tệp cần sửa**: `src/app/assessment/[id]/result/components/cards/RiasecProfileCard.tsx`
- **Công việc**:
  - Giữ nguyên Ranked visualization.
  - Bổ sung **Insight Card** bên dưới biểu đồ.
  - Tiêu đề: "Điều nổi bật trong hồ sơ của bạn".
  - Nội dung: Bind data từ `riasec.interpretation`.

### 2.3. Nâng cấp Big Five Working Style (Layer 3)
- **Tệp cần sửa**: `src/app/assessment/[id]/result/components/cards/BigFiveCard.tsx`
- **Công việc**:
  - Giữ nguyên Layer 1 (Shape) và Layer 2 (Prominent/Moderate).
  - Bổ sung **Layer 3 (Working Style & Interaction Style)**.
  - Tích hợp `bigFive.workingStyle` và `bigFive.interactionStyle` từ ReportData.
  - Thiết kế UI hiển thị thân thiện, dễ đọc thay vì chỉ list các trait.

### 2.4. Phân rã & Hoàn thiện Work Values & Insights
- **Tệp cần sửa**: 
  - `src/app/assessment/[id]/result/components/cards/WorkValuesCard.tsx`
  - `src/app/assessment/[id]/result/components/cards/InsightsCard.tsx` (Xóa/Rã)
  - Thêm mới: `StrengthCard.tsx`, `WatchOutCard.tsx`, `EnvironmentCard.tsx`
- **Công việc**:
  - **Work Values**: Layout lại thành Top 3 Value lớn. Hiển thị Icon, Tên, Short Explanation và Implication ("Điều này có ý nghĩa...").
  - **Strengths**: Tạo list 3-5 Strength Cards. Format: [ICON] TÊN ĐIỂM MẠNH - Mô tả - *Tại sao lại xuất hiện (source)*.
  - **Watch-outs**: Tạo Component độc lập. Format: [CẢNH BÁO] Tên xu hướng - Trong một số tình huống... -> *Gợi ý*. TUYỆT ĐỐI không dùng chữ "Điểm yếu".
  - **Environment**: Trực quan hóa các chiều không gian (Tự chủ, Tương tác...).

### 2.5. Bổ sung Executive Snapshot
- **Tệp cần thêm**: `src/app/assessment/[id]/result/components/cards/ExecutiveSnapshotCard.tsx`
- **Công việc**:
  - Tạo Component tóm tắt toàn bộ: Who am I? Tendency? Values? Strengths? Watch-outs?
  - Kết nối với `executiveSnapshot.deterministicSummary` từ Data Builder (cần update `report-builder.ts` để map field này từ Interpretation Engine).

### 2.6. Cải tiến Premium Teaser
- **Tệp cần sửa**: `src/app/assessment/[id]/result/components/cards/FutureExplorationCard.tsx`
- **Công việc**:
  - Thay đổi thông điệp "Sắp ra mắt" thành Value Proposition thật sự: "Bạn đã hiểu mình. Nhưng điều đó dẫn đến đâu?... Premium sẽ giúp bạn khám phá: Nghề nghiệp, Ngành học, Trường ĐH...".
  - Chặn hiển thị biểu đồ giả mạo, chỉ bán "Kết quả sẽ nhận được".

## 3. CÁC NGUYÊN TẮC CẤM (RED LINES)
- **KHÔNG** tự ý thêm Career/Major giả vào UI (Luôn bám sát Capability State = `NOT_AVAILABLE`).
- **KHÔNG** sửa logic chấm điểm hay công thức tính toán.
- **KHÔNG** tạo mock data, chỉ dùng Data Contract `ReportData`.
- **KHÔNG** làm UI dạng Analytics Admin Dashboard, hãy giữ nhịp điệu của một cuốn Profile.

## 4. KẾ HOẠCH KIỂM THỬ (VERIFICATION)
1. Xác minh UI với Result ID thật: `4956480c-eb07-4cc0-94b1-8cef748e13a8`
2. Chạy `npm run typecheck` để đảm bảo Data Flow được nối đúng.
3. Test layout trên Desktop và Mobile (375px).
4. Review với Blueprint để đóng Gate 6.5.
