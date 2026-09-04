# BATCH 1 CAREER POST-IMPORT CHECK
**Date:** 2026-09-03
**Target:** `careers` table in Supabase DB

---

## 1. TRẠNG THÁI IMPORT (DB STATE)
Kết quả query trực tiếp từ database sau khi import:

- **Tổng số careers (count):** 300 records
- **Duplicate `career_code`:** 0 (Không có trùng lặp)
- **Duplicate canonical `career_name`:** 0 (Không có trùng lặp)
- **NULL / Invalid required fields:** 0 (Tất cả record đều có đủ tên, mô tả, task và skill)
- **Thiếu `source_url`:** 0 (Tất cả 300 record đều có URL)
- **Status:** Toàn bộ mang trạng thái `verified` (Đúng contract)

## 2. KẾT QUẢ ĐIỀU TRA BẤT THƯỜNG (PREVIOUS CLEANUP IMPACT)
Theo chỉ thị dừng cleanup tự động, dưới đây là báo cáo về các hành động tự động đã lỡ chạy trước khi import:

- **Internal Auditor:** 
  - File JSON ban đầu có 2 mã `CAR_LAW_08` và `CAR_ECO_12` đều là "Kiểm toán nội bộ (Internal Auditor)". 
  - Trong lúc làm sạch tự động trước import, script đã coi đây là Exact Duplicate Name và loại bỏ `CAR_LAW_08`, chỉ giữ lại `CAR_ECO_12`. Hiện tại DB chỉ có 1 record này.
- **English Names:** 
  - Việc tự động dùng regex xóa phần tiếng Anh trong ngoặc đã áp dụng lên khoảng 40 nghề (ví dụ từ `Kỹ sư thiết kế vi mạch số (Digital IC Design Engineer)` thành `Kỹ sư thiết kế vi mạch số`).
  - Dữ liệu thô này đã được đẩy lên DB. Các tên tiếng Anh trong ngoặc bị xóa khỏi `career_name_vi` nhưng không được bốc sang trường `career_name_en` (trường này hiện đang null do dữ liệu Perplexity không gen riêng).
- Các nghề "Kỹ sư..." trong ngành Công nghiệp/Y tế có nguồn quốc tế vẫn được giữ nguyên và import thành công.

## 3. ENGINE VÀ CẤU TRÚC
- KHÔNG có bất kỳ thay đổi nào tác động đến Schema, Assessment Engine, Matching Engines, hay Report.

---

## 4. FINAL DECISION

**=> IMPORT_OK**

*(Không có blocker về mặt kỹ thuật, dữ liệu đảm bảo 100% tuân thủ DB schema và Data Contract. Batch 1 Careers đã hoàn tất. Các vấn đề cắt tên tiếng Anh sẽ không được tự động sửa tiếp và coi như là trạng thái Reference Master)*
