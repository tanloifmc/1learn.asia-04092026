# UNIVERSITY MASTER DATA SPECIFICATION
**Version:** 1.0 (MVP)
**Status:** Approved for Implementation

Tài liệu này định nghĩa cấu trúc dữ liệu cho **University Master Database**. Đây là nguồn dữ liệu trường đại học duy nhất, chính thống và có thể truy xuất nguồn gốc của hệ thống 1learn.asia, phục vụ cho luồng Khám phá (Field → Major → University) và Lập mục tiêu (Goal → Roadmap).

---

## 1. Nguyên tắc Thiết kế
- **Không giả định:** Bất kỳ dữ liệu nào cũng phải dựa trên nguồn chính thức hoặc nguồn tham khảo được chấp nhận.
- **Có thể truy vết (Traceable):** Mọi bản ghi về Trường và Quan hệ Trường-Ngành đều phải lưu lại nguồn gốc (provenance).
- **Phân loại trạng thái:** Tách bạch rõ ràng dữ liệu nháp, dữ liệu ứng viên (candidate), và dữ liệu đã xác thực.

---

## 2. University Identity Schema (Bảng `universities`)

Cấu trúc định danh của một trường Đại học phải bao gồm các thông tin sau:

| Trường thông tin | Kiểu dữ liệu | Bắt buộc (P0) | Mô tả & Ràng buộc |
|------------------|--------------|---------------|-------------------|
| `id` | UUID | Có | Khóa chính |
| `name` | Text | Có | Tên đầy đủ, chính thức (Canonical Name). Ví dụ: "Đại học Bách Khoa Hà Nội" |
| `short_name` | Text | Có | Tên viết tắt phổ biến. Ví dụ: "HUST" |
| `code` | Text | Có | Mã trường tuyển sinh Bộ GD&ĐT (nếu có). Ví dụ: "BKA" |
| `slug` | Text | Có | Đường dẫn thân thiện SEO, không dấu, nối bằng gạch ngang. Duy nhất (Unique). |
| `type` | Enum | Có | Phân loại trường: `public` (công lập), `private` (tư thục), `international` (quốc tế) |
| `ownership` | Text | Không | Đơn vị chủ quản (VD: Đại học Quốc gia, Bộ GD&ĐT...) |
| `location_city` | Text | Có | Tỉnh/Thành phố trực thuộc. VD: "Hà Nội", "Hồ Chí Minh" |
| `address` | Text | Không (P1) | Địa chỉ trụ sở chính đầy đủ. |
| `website` | Text | Có | **URL website chính thức chung của trường.** |
| `admissions_website` | Text | Không (P1) | URL trang thông tin tuyển sinh riêng (nếu có). |
| `logo_url` | Text | Không (P1) | URL ảnh logo trường. Phải có fallback UI nếu null. |
| `description` | Text | Không (P1) | Mô tả tổng quan về trường. Không tự sinh bằng AI nếu không có nguồn. |
| `status` | Enum | Có | Trạng thái hiển thị: `draft`, `published`, `archived` |

---

## 3. Data Provenance Schema (Nguồn gốc)

Tất cả các bản ghi trong Master Database bắt buộc phải lưu trữ nguồn gốc để phục vụ quá trình Verification. Các trường này có thể được gắn trực tiếp vào bảng `universities` và `university_majors`.

| Trường thông tin | Kiểu dữ liệu | Mô tả |
|------------------|--------------|-------|
| `source` | Text | Tên hoặc loại nguồn (VD: "Website chính thức", "Đề án tuyển sinh 2026") |
| `source_url` | Text | Đường dẫn URL chính xác đến tài liệu/trang web cung cấp thông tin. |
| `verification_status` | Enum | Trạng thái xác thực: `PENDING_VERIFICATION`, `INCOMPLETE`, `CURATED`, `VERIFIED`. |
| `last_verified_at` | Timestamp | Thời điểm cuối cùng dữ liệu được người duyệt kiểm tra. |
| `verified_by` | UUID | ID của Admin/Curator đã duyệt bản ghi này. |

*Lưu ý: Chỉ những bản ghi có `verification_status` = `VERIFIED` hoặc `CURATED` mới được ưu tiên hiển thị như dữ liệu chính thức cho End-user.*

---

## 4. University ↔ Major Schema (Bảng `university_majors`)

Đây là dữ liệu cốt lõi kết nối sinh viên từ kết quả trắc nghiệm đến trường học cụ thể. **Một quan hệ Trường - Ngành chỉ được tồn tại khi có bằng chứng trường đó đang đào tạo ngành đó.**

| Trường thông tin | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|------------------|--------------|----------|-------------------|
| `id` | UUID | Có | Khóa chính quan hệ. |
| `university_id` | UUID | Có | Foreign Key tham chiếu `universities.id`. |
| `major_id` | UUID | Có | Foreign Key tham chiếu `majors.id`. |
| `program_name` | Text | Không | Tên chương trình đào tạo cụ thể (VD: "Chương trình Tiên tiến", "Chất lượng cao"). Nếu null, mặc định là "Hệ chuẩn". |
| `source_url` | Text | Có | URL chứng minh trường có đào tạo ngành này (trang chi tiết ngành hoặc trang tuyển sinh của trường). |
| `verification_status` | Enum | Có | Trạng thái xác thực (Tương tự Provenance Schema). |
| `last_verified_at` | Timestamp | Có | Thời điểm kiểm tra. |

---

## 5. Cấu trúc Triển khai (Migration sắp tới)

Để đáp ứng spec này, chúng ta cần tạo một migration mới bổ sung các trường còn thiếu vào schema hiện tại của `universities` và `university_majors`:
1. Thêm cột `website`, `admissions_website`, `address`, `ownership` vào `universities`.
2. Thêm cột `source_url`, `verification_status`, `last_verified_at` vào `university_majors`.

*Chưa thực hiện tạo migration khi chưa có kế hoạch nhập dữ liệu đợt 1 hoàn tất.*
