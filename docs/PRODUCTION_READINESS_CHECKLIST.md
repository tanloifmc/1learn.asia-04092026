# PRODUCTION READINESS CHECKLIST

> Quá trình chuẩn bị Launch được chia làm 7 Giai đoạn. 
> Chỉ khi Giai đoạn trước hoàn thành (PASS), mới được tiến sang Giai đoạn tiếp theo.

## PHASE A: PRODUCT ACCEPTANCE
- [x] **Student Journey PASS**: Đảm bảo luồng Khám phá -> Lựa chọn -> Mục tiêu -> Hành động thông suốt.
- [x] **Parent Journey PASS**: Đảm bảo luồng tạo/nhập mã mời (Kế thừa Phase 7) và RLS.

## PHASE B: PRODUCTION DATA QA
- [ ] Lập báo cáo `PRODUCTION_DATA_QUALITY_REPORT.md`.
- [ ] Xác minh Career, Major, University, Admission data có nguồn và verification_status.

## PHASE C: SECURITY / PRIVACY AUDIT
- [ ] Lập báo cáo `PRODUCTION_SECURITY_AUDIT.md`.
- [ ] Kiểm tra RLS, Frontend + Server Authorization, Token Expiry.

## PHASE D: INFRASTRUCTURE / ENVIRONMENT
- [ ] Tách biệt biến môi trường LOCAL / STAGING / PRODUCTION.
- [ ] Backup / Restore / Migration Rollback strategy.
- [ ] Script Persona Minh có 3 lớp bảo vệ (chỉ chạy ở Non-Production).

## PHASE E: E2E / SMOKE / PERFORMANCE
- [ ] Lập báo cáo `PRODUCTION_SMOKE_TEST.md`.
- [ ] Core E2E Scripts (UI + DB state sync) bằng Playwright.
- [ ] Kiểm tra Performance (Initial load, DB query, Matching execution).

## PHASE F: PILOT
- [ ] Chạy nghiệm thu giới hạn 10-30 người dùng.
- [ ] Đánh giá Behavior, Comprehension, Trust.

## GO / NO-GO REVIEW
- [ ] PRODUCT (PASS/FAIL)
- [ ] DATA (PASS/FAIL)
- [ ] SECURITY (PASS/FAIL)
- [ ] QUALITY (PASS/FAIL)
- [ ] PERFORMANCE (PASS/FAIL)
- [ ] OBSERVABILITY (PASS/FAIL)
- [ ] INFRASTRUCTURE (PASS/FAIL)
- [ ] PRIVACY (PASS/FAIL)

## PHASE G: PRODUCTION LAUNCH
- [ ] Chuyển trạng thái dự án sang LAUNCHED.
- [ ] Ghi nhận `PRODUCTION_LAUNCH_REPORT.md`.
