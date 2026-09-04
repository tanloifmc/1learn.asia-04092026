# DATA CURATION SPECIFICATION REVIEW

**Review Date:** 2026-08-29
**Target Document:** `docs/17_DATA_CURATION_SPECIFICATION.md`

---

## 1. Data Model Consistency
- **BLOCKER**: Tồn tại mâu thuẫn giữa Specification và Database Schema thực tế.
  - Spec định nghĩa tất cả entity phải có 4 trường: `source`, `source_url`, `last_verified_at`, `verified_by`.
  - Trong schema hiện tại (Phase 16), bảng `career_major_mappings` **HOÀN TOÀN THIẾU** cột `source`. Nó chỉ được add `source_url`, `last_verified_at`, và `verified_by`. Do đó rule "Không được null source" sẽ crash khi code logic.
- **MEDIUM**: Cột trạng thái của bảng `admission_data` tên là `data_status`, nhưng trong toàn bộ văn bản Spec lại đang gọi chung là `status`. Cần làm rõ để tránh lỗi khi dev UI.

## 2. Lifecycle Consistency
- **HIGH**: Spec nhắc đến quá trình "DISCOVER → VERIFY → ENTER SOURCE → REVIEW → PUBLISH" nhưng lại chỉ nói cập nhật trạng thái từ `draft` thẳng lên `published`. Schema hiện tại có các trạng thái trung gian (`imported`, `validated`, `verified`). Spec chưa định nghĩa rõ lúc nào thì dùng các trạng thái này (Hay là bỏ qua và đi thẳng từ draft lên published?).

## 3. Publication Dependency
- **APPROVED**: Các rule về Dependency rất chặt chẽ và chính xác (Con không được phép public nếu Cha chưa public).
- **MEDIUM**: Database hiện tại KHÔNG dùng PostgreSQL Trigger để chặn việc Publish con khi Cha chưa publish (Nhằm tránh complex transaction). Do đó, Application Layer (Curation UI) PHẢI là nơi thực thi hard-block này trước khi gọi API update. Spec cần nhấn mạnh điều này.

## 4. Provenance Integrity
- **APPROVED**: Quy tắc "Không hallucinate" và "Luôn mượn nguồn chính thống" được định nghĩa rất tốt. Tuy nhiên bị vướng lỗi thiếu field ở phần 1.

## 5. Human Curator Workflow
- **APPROVED**: Workflow khá rõ ràng. Việc system tự động stamp `last_verified_at` và `verified_by` thay vì để user tự chọn là một practice rất tốt về bảo mật (Audit trailing).

## 6. Bulk Import Safety
- **LOW**: Điều khoản cho phép Bulk Import script bypass và set thẳng `status = 'published'` nếu có đủ provenance là một rủi ro tiềm ẩn. Cần giới hạn rõ: Chỉ Admin cấp cao mới được cấp cờ (flag) bypass này.

## 7. RLS/Security Implications
- **APPROVED**: Policy RLS `USING (status = 'published')` đã cover đúng với rules. 

---

## TỔNG KẾT & KIẾN NGHỊ

**Tình trạng:** 🔴 **BLOCKER - CHƯA SẴN SÀNG ĐỂ IMPLEMENT**

**Hành động yêu cầu trước khi đi tiếp:**
1. Sửa Database Schema (Cần thêm `source TEXT` cho bảng `career_major_mappings`).
2. Sửa lại Spec Document:
   - Cập nhật tên field `data_status` cho `admission_data`.
   - Làm rõ vòng đời của các trạng thái trung gian (`imported`, `verified`) trong phần 4. Lifecycle Transitions.
   - Nhấn mạnh việc Curation API/UI phải tự check Dependency rule vì Database không xài Trigger chặn.

Sau khi hoàn tất 2 việc trên, Contract này mới đạt trạng thái READY FOR IMPLEMENTATION.
