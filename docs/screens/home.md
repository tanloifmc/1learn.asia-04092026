# Screen Contract: Homepage (`/`)

## Purpose
Trang chủ đóng vai trò là "cửa ngõ" giải thích giá trị cốt lõi của 1learn.asia. Không phải là trang bán hàng, mà là một nơi thấu hiểu và cung cấp giải pháp cho học sinh cấp 3 đang bế tắc trong việc chọn nghề, cũng như phụ huynh đang hoang mang cách đồng hành cùng con.

## User
- **Học sinh (Lớp 10-12):** Đang phân vân, không biết mình hợp nghề gì, phải học ngành nào, trường nào. Cần một lộ trình.
- **Phụ huynh:** Sợ con chọn sai, muốn giúp nhưng sợ ép buộc con. Cần công cụ để hiểu con mình.

## Primary Goal
Khách truy cập hiểu được: "1learn.asia là gì, giải quyết vấn đề gì cho tôi, và quy trình 4 bước hoạt động ra sao". Sau đó, thuyết phục họ nhấn nút "Bắt đầu khám phá" (Đăng ký/Đăng nhập).

## Inputs
- Không yêu cầu input trước khi đăng nhập. Khách chỉ scroll và đọc thông tin.
- (Marketing tracking/UTM nếu có).

## Outputs
- Landing page tĩnh với thông tin được cấu trúc rõ ràng.
- Các Mockup minh họa sản phẩm (Illustrative Product States).

## Actions
- `Login`: Mở modal/chuyển hướng sang trang đăng nhập.
- `Start Exploring (CTA)`: Chuyển hướng sang quy trình Onboarding/Signup.
- `View Sections`: Cuộn qua các section (Vấn đề, Giải pháp, Minh họa UI, Cam kết).

## Data Source
- Static content (Copywriting).
- Không gọi Database (trừ kiểm tra session auth hiện tại để redirect sang `/dashboard` nếu đã đăng nhập).

## States
- **Unauthenticated:** Hiển thị Landing Page giới thiệu.
- **Authenticated:** Middleware tự động redirect sang `/dashboard` (hoặc Explore/Assessment tùy trạng thái user).

## CTA
- "Bắt đầu hành trình khám phá" (Primary)
- "Đăng nhập" (Secondary)

## Privacy
- Dữ liệu hoàn toàn công khai.
- Hình ảnh Mockup UI minh họa KHÔNG dùng thông tin thật (sẽ dùng tên giả định như "Học sinh A" hoặc ẩn danh, dữ liệu illustrative chung chung). Không lấy data từ DB.
