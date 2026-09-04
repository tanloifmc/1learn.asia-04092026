# Hướng dẫn Khắc phục Thảm họa (Disaster Recovery - DR)

Tài liệu này quy định các nguyên tắc và bước hành động để khôi phục hệ thống trong trường hợp xảy ra sự cố nghiêm trọng, bảo vệ toàn vẹn dữ liệu và duy trì tính khả dụng của nền tảng 1learn.asia.

## 1. Nguyên tắc An toàn Cốt lõi (Hard Safety Boundaries)

1. **Database Role Separation:** Vercel Preview/Staging chỉ được phép kết nối tới Supabase Staging. Vercel Production chỉ được phép kết nối tới Supabase Production. Mọi luồng giao tiếp chéo đều bị cấm.
2. **Migration Safety Gate:** Quy trình đẩy Schema bắt buộc phải qua các bước: `Local -> Staging -> Staging Tests -> Production`. Tuyệt đối **CẤM** viết SQL trực tiếp lên Database Production.
3. **Demo Data Isolation:** Kịch bản tạo dữ liệu mẫu (`seed_persona_minh.ts`) bị cấm chạy trên môi trường Production bằng Hard Guard (kiểm tra `SUPABASE_PROJECT_REF` và `SUPABASE_URL`).
4. **Identity Principle:** Dữ liệu demo được nhận diện qua cột `is_demo = true` trên bảng `profiles`. Bất kỳ câu query thống kê/nghiệp vụ nào cũng phải filter qua helper function `is_real_user(uuid)`.

## 2. Phân biệt Rollback và Forward-Fix

Trong vận hành thực tế, cần phân biệt rõ giữa Application Rollback và Database Rollback:

*   **Application Rollback (Được phép):** Là việc khôi phục phiên bản code của ứng dụng (VD: Trên Vercel, revert từ bản v123 về bản v122). Thao tác này an toàn nếu không có thay đổi breaking schema tương ứng.
*   **Database Rollback (BỊ CẤM):** Là việc hạ cấp cấu trúc Database bằng lệnh Migration `down`. Việc này tiềm ẩn rủi ro xóa mất dữ liệu người dùng.
*   **Database Forward-Fix (BẮT BUỘC):** Mọi lỗi xảy ra trên Database Production đều phải được vá bằng một file Migration `up` mới (ví dụ: tạo file migration mới để sửa lại type/column bị sai thay vì chạy lệnh down file cũ).

## 3. Khung khôi phục dữ liệu (Recovery Framework)

### RPO (Recovery Point Objective)
Mục tiêu thời điểm phục hồi dữ liệu: **Tối đa 24 giờ** (dựa trên bản Daily Backup mặc định của Supabase). Nâng cấp PITR (Point-in-Time Recovery) cho RPO tính bằng phút sẽ được xem xét khi lượng người dùng trả phí tăng cao.

### RTO (Recovery Time Objective)
Mục tiêu thời gian khôi phục hệ thống: **Dưới 4 giờ** kể từ lúc phát hiện sự cố.

### Các bước Khôi phục (Restore Steps)
1. **Cô lập sự cố:** Đánh giá mức độ hỏng hóc. Nếu cần thiết, kích hoạt *Production Kill Switch* (chế độ bảo trì) để ngăn người dùng tiếp tục ghi dữ liệu lỗi.
2. **Truy cập Dashboard:** Đăng nhập Supabase Dashboard -> Database -> Backups.
3. **Thử nghiệm trên Staging (BẮT BUỘC):** Khôi phục bản backup gần nhất lên môi trường Staging. Không bao giờ khôi phục trực tiếp đè lên Production khi chưa kiểm tra.
4. **Smoke Test:** Chạy bộ test trên Staging DB vừa được khôi phục để xác minh tính nguyên vẹn dữ liệu và chính sách RLS.
5. **Thực thi trên Production:** Khi Staging DB đã được xác nhận an toàn, thực hiện quy trình Restore lên Production.

## 4. Production Kill Switch (Tính năng trong tương lai)

Hệ thống sẽ được thiết kế các cờ bật/tắt động trong Admin Dashboard (hoặc qua Edge Config) để:
*   `disable_registration`: Ngăn chặn đăng ký tài khoản mới khi hệ thống đang bất ổn.
*   `disable_assessment`: Tạm ngưng làm bài test mới.
*   `maintenance_mode`: Chặn mọi request (trừ admin) và hiển thị trang bảo trì.
Trong Phase 1 (Launch), nếu cần thiết, tính năng này sẽ được thay thế bằng Vercel Environment Variables.
