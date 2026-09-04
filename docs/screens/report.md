# Screen Contract: Personal Report (`/assessment/report`)

## Purpose
Trình bày kết quả đánh giá tâm lý/định hướng dưới dạng một báo cáo phân tích sâu sắc, dễ hiểu, giúp học sinh trả lời 8 câu hỏi cốt lõi về bản thân và gợi ý các bước khám phá tiếp theo.

## User
- **Học sinh:** Xem kết quả của chính mình.
- **Phụ huynh (Read-only):** Được cấp quyền xem thông qua Parent Portal, nhằm hiểu con hơn.

## Primary Goal
Giúp người đọc "À há!" về bản thân (hoặc con cái), cảm thấy được thấu hiểu chứ không bị phán xét. Đưa ra hướng đi thực tế (Explore Careers/Majors) dựa trên data.

## Inputs
- Kết quả đã lưu từ `assessment_results` và `derived_profile_signals`.

## Outputs
- Data visualization (biểu đồ radar, thanh tiến độ điểm mạnh/yếu).
- Insights (nhận xét bằng chữ dựa trên điểm số).
- Danh sách Career/Major gợi ý.

## Actions
- `View Details`: Mở rộng để xem giải thích chi tiết cho từng chỉ số.
- `Explore Matches`: Chuyển sang tính năng Matching/Explore với các ngành nghề phù hợp.
- `Share with Parent`: Gửi link/mã cho phụ huynh (nếu chưa kết nối).

## Data Source
- **Read:** `assessment_results`, `derived_profile_signals`, `assessment_dimensions`.

## States
- **Loading:** Fetching and compiling report.
- **Empty/Error:** Không tìm thấy kết quả (chưa làm bài).
- **Ready:** Hiển thị toàn bộ báo cáo.

## CTA
- "Khám phá các ngành nghề phù hợp với bạn" (Primary)

## Privacy
- Bảo mật tuyệt đối. RLS giới hạn chỉ `auth.uid()` (và Phụ huynh đã được ủy quyền) mới đọc được.
- Cấm các đánh giá tiêu cực mang tính phán xét cá nhân. Dùng từ ngữ trung lập, xây dựng.
