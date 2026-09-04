# DATA BACKBONE AUDIT

## Mục tiêu
Kiểm tra tính vẹn toàn, nguồn gốc và sự phân mảnh của dữ liệu cốt lõi (Data Backbone) trong MVP, bao gồm `fields`, `majors`, `universities`, và mapping giữa chúng.

---

## 1. `fields` (Lĩnh vực)

* **Tổng số fields:** 10
* **Trạng thái Mapping RIASEC:** Tất cả các field hiện tại đều có `riasec_mapping`. Đây là dữ liệu được **seed bằng heuristic/manual curation** trong quá trình chuyển đổi MVP (Phase 17), nhằm đơn giản hóa hệ thống Career Recommendation cũ sang Field Recommendation.
* **Danh sách Fields:**
  * `cong-nghe-ky-thuat` (Công nghệ & Kỹ thuật) - RIASEC: `R,I`
  * `kinh-doanh-quan-ly` (Kinh doanh & Quản lý) - RIASEC: `E,C`
  * `thiet-ke-sang-tao` (Thiết kế & Sáng tạo) - RIASEC: `A`
  * `truyen-thong-bao-chi` (Truyền thông & Báo chí) - RIASEC: `A,E`
  * `khoa-hoc-nghien-cuu` (Khoa học & Nghiên cứu) - RIASEC: `I`
  * `giao-duc-xa-hoi` (Giáo dục & Xã hội) - RIASEC: `S`
  * `y-te-suc-khoe` (Y tế & Sức khỏe) - RIASEC: `I,S`
  * `luat-hanh-chinh` (Luật & Hành chính) - RIASEC: `E,C`
  * `dich-vu-du-lich` (Dịch vụ & Du lịch) - RIASEC: `S,E`
  * `nong-lam-ngu-nghiep` (Nông lâm ngư nghiệp) - RIASEC: `R`

---

## 2. `majors` (Ngành học)

* **Tổng số majors:** 50
* **Majors có field_id (Mapping heuristic):** 0 (Mapping bằng string match theo `name/field` cũ, không phải mapping thủ công xác thực)
* **Majors không có field_id (Orphan majors):** 50
* **Đánh giá Heuristic:** Toàn bộ liên kết giữa Major và Field hiện tại là heuristic, **chưa được verify thủ công**. Rất nhiều majors chưa có `field_id` vì thuật toán string matching đơn giản không bao phủ hết.

---

## 3. `universities` (Trường Đại học)

* **Tổng số universities:** 31
* **Trường có website:** 0
* **Trường có logo:** 0
* **Trường thiếu logo/thông tin cơ bản:** 31

---

## 4. University ↔ Major Mapping

* **Tổng số quan hệ Uni-Major:** 6
* **Nguồn gốc:** Hầu hết đều từ dữ liệu crawler ban đầu, chưa có nguồn provenance chính thức (Phase 16 đã bị disable).

---

## 5. Data Provenance & Lifecycle (Tình trạng Schema)

* **Phase 16 (Provenance & Lifecycle) Status:** **DISABLED** (Bị vô hiệu hóa theo chỉ đạo MVP).
* **Thiệt hại/Đánh đổi:** Hệ thống MVP sẽ không thể track được ai đã cập nhật, dữ liệu này lấy từ nguồn nào (URL/PDF), và đang ở trạng thái nháp hay đã xuất bản. Toàn bộ record hiện tại được giả định là có thể hiển thị.

---

## 6. Integrity Checks (Cảnh báo dữ liệu)

* **Orphan Majors (Không có Field):** 50 majors.
* **Orphan Universities (Không có Major nào):** 25 trường.
* **Fields không có Major nào:** 10 lĩnh vực.
  - `Công nghệ & Kỹ thuật`
  - `Kinh doanh & Quản lý`
  - `Thiết kế & Sáng tạo`
  - `Truyền thông & Báo chí`
  - `Khoa học & Nghiên cứu`
  - `Giáo dục & Xã hội`
  - `Y tế & Sức khỏe`
  - `Luật & Hành chính`
  - `Dịch vụ & Du lịch`
  - `Nông lâm ngư nghiệp`
* **Duplicate University Slugs:** 0
* **Duplicate Major Slugs:** 0

---

## 7. Đề xuất thứ tự Curation

1. **Field ↔ Major Mapping:** Bắt buộc phải gom 50 Majors hiện tại vào 10 Fields bằng tay (thông qua Tool Admin hoặc SQL) để đảm bảo không bị đứt gãy luồng Khám phá. Không thể tin tưởng heuristic string matching.
2. **University Enrichment:** Bổ sung Logo và Website cho 31 trường chưa có logo.
3. **Clean Orphan Data:** Xóa hoặc ẩn các Majors/Universities rác không có liên kết với nhau (ví dụ 25 trường không có ngành học).
