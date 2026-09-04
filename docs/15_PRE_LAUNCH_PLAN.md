# 15. PRODUCTION READINESS & PRE-LAUNCH PLAN

**Mục tiêu:** Chứng minh sản phẩm hiện tại an toàn, chức năng chạy chuẩn xác, có khả năng giám sát, có khả năng khôi phục và hoàn toàn sẵn sàng cho người dùng thật (Pilot -> Production). TUYỆT ĐỐI không phát triển tính năng mới.

## Các Giai đoạn Thực thi (Phases)
Kế hoạch sẽ được tiến hành qua 7 giai đoạn nối tiếp. Chỉ khi một giai đoạn đánh PASS, chúng ta mới đi tiếp.

### PHASE A: Product Acceptance (Nghiệm thu Sản phẩm) - ✅ PASS
- **Mục tiêu:** Verify toàn bộ luồng học sinh (Landing -> Onboarding -> Assessment -> Report -> Explore -> Compare -> Goal -> Journey -> Task Complete -> Home) và luồng phụ huynh.
- **Nguyên tắc Parent Linking:** Audit và TÁI SỬ DỤNG kiến trúc Phase 7. Không tạo bảng mới.
- **Trạng thái:** Đã hoàn thành (Auth checks added, 48h expiry enforced, luồng không đứt gãy).

### PHASE B: Production Data QA (Kiểm soát chất lượng Dữ liệu) - 🚧 IN PROGRESS (Remediation)
- **Mục tiêu:** Đảm bảo không có "Mock Data" (Dữ liệu rác) ở môi trường Production.
- **Công việc:** Rà soát các bảng careers, majors, universities, admission_data. Mọi dữ liệu recommend phải có nguồn (source), trạng thái xác thực (verification_status). 
- **Remediation Directive:** Tạo Launch-Critical Tier A, thêm cờ `is_production_eligible`, không bịa đặt nguồn, cập nhật `match_runs` traceability. Lập `PRODUCTION_DATA_QUALITY_REPORT.md`.

### PHASE C: Security / Privacy Audit (Bảo mật & Quyền riêng tư) - ⏳ NOT STARTED
- **Mục tiêu:** Đảm bảo an toàn dữ liệu, đặc biệt là quyền của Phụ huynh / Học sinh.
- **Công việc:** Review RLS, Token expiry, Role assignments. Không gửi data nhạy cảm vào Sentry/Log. Lập `PRODUCTION_SECURITY_AUDIT.md`.

### PHASE D: Infrastructure & Environment (Hạ tầng & Phân tách môi trường) - ⏳ NOT STARTED
- **Mục tiêu:** Tách bạch LOCAL / STAGING / PRODUCTION. Đảm bảo có kế hoạch Backup và Restore.
- **Công việc:** Check cấu hình Env. Viết script `seed-persona-minh.mjs` nhưng CÓ GUARD BẢO VỆ (chỉ chạy khi `NODE_ENV !== 'production'`). Account Minh phải được đánh dấu `is_demo = true`. Lên phương án Rollback/Forward-fix cho Database Migration.

### PHASE E: E2E / Smoke / Performance Testing - ✅ APPROVED
- **Mục tiêu:** Chứng minh hệ thống không sập khi có nhiều user, logic chạy đúng từ đầu đến cuối.
- **Giới hạn đã biết (Known Limitation):** Hệ thống đang hoạt động an toàn ở mức **≤ 50 CCU (Operating Envelope)**. Tại 100 CCU, Supabase connection pool chạm ngưỡng gây ra lỗi 503 (Platform Limitation). Sẽ cấu hình Retry/Backoff và Monitoring cho các lỗi 503 này. Không nâng cấp Infra ở Phase F.

### PHASE F: Pilot (Chạy thử nghiệm) - 🟢 READY FOR PILOT
- **Mục tiêu:** Mở cho 10-30 người dùng thật (Học sinh + Phụ huynh) để thu thập feedback thực tế về giá trị sản phẩm. KHÔNG phải kiểm thử kỹ thuật.
- **Thước đo giá trị (Metrics):**
  1. Tỷ lệ hoàn thành Assessment (Assessment Completion).
  2. Tỷ lệ tạo Mục tiêu (Goal Creation).
  3. Tỷ lệ hoàn thành Task đầu tiên (First Task Completion).
  4. Tỷ lệ quay lại sau 7 ngày (7-day Return).
- **Công việc:** Theo dõi hành vi, thu thập feedback và sửa các lỗi dựa trên Data thật. Lập báo cáo đo lường.

### PHASE G: Production Launch (Ra mắt chính thức) - ⏳ NOT STARTED
- **Mục tiêu:** Đạt đủ 8 tiêu chí Launch Gate (Product, Data, Security, Quality, Performance, Observability, Infra, Privacy).
- **Hành động:** Chuyển trạng thái sang READY FOR PRODUCTION và Marketing. Lập `PRODUCTION_LAUNCH_REPORT.md`.

---

## Danh sách Tài liệu Bắt buộc (Required Documents)
Tôi sẽ lần lượt tạo và điền thông tin vào 5 tài liệu sau trong quá trình thực thi:
- [x] `docs/PRODUCTION_READINESS_CHECKLIST.md` (Checklist tổng hợp)
- [ ] `docs/PRODUCTION_SECURITY_AUDIT.md` (Sẽ tạo ở Phase C)
- [x] `docs/PRODUCTION_DATA_QUALITY_REPORT.md` (Đang cập nhật ở Phase B)
- [ ] `docs/PRODUCTION_SMOKE_TEST.md` (Sẽ tạo ở Phase E)
- [ ] `docs/PRODUCTION_LAUNCH_REPORT.md` (Sẽ tạo ở Phase G)
