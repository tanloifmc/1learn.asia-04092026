# DATA AUDIT V1.0 - CTO REPORT

## 1. Executive Summary

Cuộc kiểm toán này (Data Audit V1.0) tập trung vào việc đánh giá hiện trạng thực tế của cơ sở dữ liệu trên môi trường Remote (Supabase). Mục tiêu cốt lõi là xác định **PROVENANCE** (nguồn gốc), **QUALITY** (chất lượng) và **INTEGRITY** (tính toàn vẹn) của dữ liệu hiện tại, đồng thời trả lời câu hỏi: Hệ thống có đủ dữ liệu thật để chạy E2E và lên Production hay chưa?

**Kết luận chính:**
1. **Toàn bộ hệ thống hiện tại là UNKNOWN/SYNTHETIC.** Gần như 100% dữ liệu không có nguồn gốc rõ ràng (Provenance Unknown).
2. **Backbone Career → Major gãy hoàn toàn.** Trong 505 careers, có tới **504 careers KHÔNG có education_paths**. Duy nhất 1 career có data nhưng lại map tới một major không tồn tại (orphan).
3. **Backbone University → Major hỏng nặng.** Mặc dù có 1,000 bản ghi `university_majors`, nhưng có tới **998 bản ghi bị orphan** (trỏ tới university_id hoặc major_id không tồn tại), và **888 bản ghi bị trùng lặp**.
4. **Admission Data gần như trống.** Chỉ có 7 bản ghi và hoàn toàn không có thông tin nguồn gốc.
5. **CSV 161 Nghề có nguồn gốc nhưng schema không tương thích 100%.** Cần Transformation pipeline trước khi import.

---

## 2. Actual Remote DB Row Counts & Status

- **Careers:** 505 rows (Published / Archived)
- **Majors:** 377 rows (Published)
- **Universities:** 335 rows (Published)
- **University Majors:** 1,000 rows
- **Admission Data:** 7 rows

---

## 3. Dataset-by-Dataset Provenance

### 3.1. Careers (505 rows)
- **Source:** 503 rows không có thông tin nguồn (`UNKNOWN`). 2 rows có source `Internal Research`.
- **Classification:** **UNKNOWN / SYNTHETIC**. Không đủ evidence để khẳng định là Real Data.

### 3.2. Majors (377 rows)
- **Source:** 377/377 rows `UNKNOWN`. Không có bất kỳ provenance evidence nào.
- **Classification:** **UNKNOWN / SYNTHETIC**.

### 3.3. Universities (335 rows)
- **Source:** Khoảng 304 rows ghi nhận source `Tuyensinh247`, 31 rows `UNKNOWN`.
- **Classification:** **MIXED**. Dữ liệu có thể là cào (scrape) từ Tuyensinh247 nhưng cần kiểm chứng lại metadata (URL, Year).

### 3.4. University Majors (1,000 rows)
- **Source:** `Tuyensinh247`
- **Classification:** **MIXED**, tuy nhiên chất lượng dữ liệu cực kỳ kém (xem phần Audit Quality).

### 3.5. Admission Data (7 rows)
- **Source:** 7/7 rows `UNKNOWN`.
- **Classification:** **UNKNOWN / SYNTHETIC**.

---

## 4. Data Quality Audit & Referential Integrity

### 4.1. Career → Major Audit
- **Null Rate:** 504/505 Careers (~99.8%) bị **NULL `education_paths`**.
- **Orphan Mapping:** 1 Career duy nhất có mapping JSON lại trỏ tới một `major_code` không tồn tại trong bảng `majors`.
- **Duplicate Mapping:** 0 (do không có data).
- **Đánh giá:** Backbone định hướng từ Nghề sang Ngành học hoàn toàn **BỊ ĐỨT GÃY**. Thuật toán Major Matching sẽ luôn trả về rỗng.

### 4.2. University → Major Audit
- **Total Rows:** 1,000 mappings.
- **Orphan Mappings:** **998/1,000 mappings bị orphan** (Foreign Key vi phạm - Trỏ tới `university_id` hoặc `major_id` đã bị xóa hoặc không khớp).
- **Duplicate Mappings:** **888 duplicates** (chỉ có 112 unique mappings).
- **Đánh giá:** Bảng quan hệ này chứa toàn dữ liệu rác/lỗi sinh tự động. Cần Wipe & Re-import toàn bộ.

### 4.3. Universities Duplicate Audit
- Có tới **30 Universities bị duplicate code** trên tổng số 335 trường. Điều này sẽ phá vỡ logic tra cứu và matching.

### 4.4. Admission Data Audit
- 7 records không có nguồn gốc.
- Không thể phân biệt được Historical Actual Score hay Projected Score.
- Các liên kết tới University và Major không có tính xác thực.

---

## 5. CSV Audit: `career_dataset_mvp.csv`

**KHÔNG THỰC HIỆN IMPORT.** (Chỉ kiểm tra cấu trúc)

- **Rows:** 162 (chưa tính header).
- **Encoding:** UTF-8, tiếng Việt chuẩn (có dấu hợp lệ).
- **Provenance:** Rõ ràng, có các cột `source_name` (ILO, GF Hướng nghiệp...) và `source_url`.
- **Columns:** `career_name_vi`, `career_name_en`, `career_group`, `short_description_vi`, `main_tasks_vi`, `suitable_traits_vi`, `riasec_code`, `source_name`, `source_url`.
- **Khả năng tương thích Schema (`careers` table):**
  - **Map trực tiếp được:** name, description (short_description_vi), source, source_url.
  - **Cần Transformation:** `main_tasks_vi` (map sang `daily_tasks`), `riasec_code` (map sang RIASEC dimensions).
  - **Thiếu:** `education_paths`, `skills_required`, `tools_used`, `career_paths`, `who_fits`, `pros`, `cons`.
- **Đánh giá:** Đây là **VERIFIED_REAL** data, tuy nhiên chỉ phủ được một phần field bắt buộc của bảng Careers (theo Product Bible). Cần làm giàu thêm dữ liệu hoặc nới lỏng schema constraints trước khi Import.

---

## 6. Data Readiness Matrix

| Dataset | Rows | Provenance | Quality | Production Ready | Blocking Issues |
|---|---:|---|---|---|---|
| Careers | 505 | UNKNOWN | Rỗng `education_paths` | NO | Thiếu map nghề-ngành 99.8%. Data không nguồn. |
| Majors | 377 | UNKNOWN | Chưa xác minh | NO | Không có provenance. |
| Universities | 335 | MIXED | 30 Duplicate codes | NO | Lỗi duplicate, cần làm sạch. |
| University-Major| 1000 | MIXED | 998 Orphan, 888 Dups | NO | Bảng rác, vi phạm FK nghiêm trọng. |
| Admission | 7 | UNKNOWN | Trống trơn | NO | Không có dữ liệu điểm chuẩn thực tế. |
| Career-Major | 0 | N/A | Không tồn tại | NO | JSON array trống ở bảng Careers. |

---

## 7. E2E Readiness

- **Flow A (Assessment → Career Matching):** `PARTIALLY_READY` (Thuật toán chạy được, nhưng kết quả career trả ra là dữ liệu ảo).
- **Flow B (Career → Major Matching):** `BLOCKED` (Thiếu 99.8% dữ liệu `education_paths`).
- **Flow C (Major → University):** `BLOCKED` (998/1000 bản ghi mapping là mồ côi/rác).
- **Flow D (University → Admission):** `BLOCKED` (Chỉ có 7 bản ghi không nguồn gốc).
- **Flow E (Toàn bộ):** `BLOCKED`.

---

## 8. Kết luận & Đề xuất (Next Actions)

**1. FACTS:** Hệ thống dữ liệu hiện tại là 99% Synthetic, chưa thể dùng cho E2E. Đặc biệt 2 backbone (Career → Major và University → Major) bị gãy hoặc chứa toàn rác.
**2. PROVENANCE:** Hầu hết là UNKNOWN. Chỉ có CSV `career_dataset_mvp.csv` là **VERIFIED_REAL**.
**3. BLOCKERS:** Không có `education_paths` nên Major Engine V1.0 vừa hoàn thiện sẽ không có Data để chạy thực tế. Không có ánh xạ Trường-Ngành hợp lệ.

**Đề xuất Data Next Steps (Chưa thực hiện):**
1. **Wipe:** Xóa toàn bộ dữ liệu UNKNOWN/SYNTHETIC trong `careers`, `majors`, `universities` và các bảng mapping (sau khi backup).
2. **Data Normalization Spec:** Xây dựng Spec chuẩn hóa file CSV 161 Nghề (xử lý các cột bị thiếu so với DB schema).
3. **Data Sourcing:** Yêu cầu cung cấp thêm Data chuẩn cho Majors, Universities, và ánh xạ University-Major.
4. **Import Pipeline:** Xây dựng script import an toàn với Validation (không bao giờ chèn orphan data). 

_Báo cáo kết thúc._
