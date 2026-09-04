# UNIVERSITY & MAJOR EXPLORATION UI SPEC
**Version:** 1.0 (MVP)
**Status:** Approved for Implementation

Tài liệu này quy định hợp đồng thiết kế (UI Contract) cho toàn bộ luồng khám phá từ Lĩnh vực (Field) → Ngành học (Major) → Trường Đại học (University).

---

## Nguyên Tắc Chung
1. **Phản ánh dữ liệu thật:** Tuyệt đối không hardcode, không dùng placeholder data, không giả lập giao diện có dữ liệu nếu database trống.
2. **Quản trị trạng thái:** Mọi trang phải có đầy đủ `Loading State`, `Error State`, và `Empty State`.
3. **Responsive:** Tối ưu hóa trải nghiệm trên Mobile (ưu tiên) và Desktop.
4. **Nhận diện dữ liệu:** Dữ liệu có trạng thái xác thực (`VERIFIED`, `CURATED`) hiển thị bình thường. Dữ liệu chưa xác thực (`PENDING_VERIFICATION`) phải có badge cảnh báo (Ví dụ: ⚠️ *Đang chờ xác minh*).

---

## 1. Màn hình Khám phá Lĩnh vực (`/explore`)

**Mục tiêu:** Hiển thị 10 Lĩnh vực chuẩn đã được định nghĩa.

- **Header:** "Khám phá các lĩnh vực học tập"
- **Grid Lĩnh vực:**
  - Card hiển thị: Icon, Tên lĩnh vực, Mô tả ngắn.
  - Khi click → Điều hướng sang `/explore/[field-slug]`
- **Trạng thái:**
  - `Loading`: Skeleton grid.
  - `Empty`: "Hệ thống đang cập nhật lĩnh vực học tập." (Thực tế không bao giờ xảy ra vì 10 Fields đã hardcode/seed).

---

## 2. Màn hình Chi tiết Lĩnh vực (`/explore/[field-slug]`)

**Mục tiêu:** Hiển thị danh sách các Ngành học (Majors) thuộc Lĩnh vực đó.

- **Header:**
  - Tên Lĩnh vực (VD: Công nghệ & Kỹ thuật)
  - Đoạn mô tả.
  - Breadcrumb: Khám phá > Công nghệ & Kỹ thuật
- **Danh sách Ngành (Majors List):**
  - Hiển thị theo dạng List hoặc Grid.
  - Mỗi Major Card gồm: Tên ngành, Số trường đang đào tạo ngành này (Lấy từ count `university_majors`).
  - Nút CTA: "Xem danh sách trường" → Điều hướng sang `/majors/[major-slug]`
- **Trạng thái:**
  - `Empty State` (Nếu lĩnh vực không có ngành nào): Hiển thị hình minh họa trống + Text: "Hiện chưa có ngành học nào thuộc lĩnh vực này được cập nhật." Không hiển thị khoảng trắng vô nghĩa.
  - `Loading`: Skeleton cho phần header và list.

---

## 3. Màn hình Chi tiết Ngành học (`/majors/[major-slug]`)

**Mục tiêu:** Hiển thị chi tiết ngành và danh sách các trường đại học ĐANG ĐÀO TẠO ngành này.

- **Header:**
  - Tên ngành (VD: Khoa học máy tính)
  - Breadcrumb: Khám phá > Công nghệ & Kỹ thuật > Khoa học máy tính
- **Tổng quan ngành (Major Overview):**
  - Tóm tắt ngành học (nếu có dữ liệu `description`). Nếu null → Ẩn block này.
- **Danh sách Trường (University List):**
  - Header nhỏ: "Các trường đại học đào tạo ngành Khoa học máy tính" (Số lượng trường).
  - Filter/Sort cơ bản: Lọc theo Tỉnh/Thành phố (nếu có > 5 trường).
  - University Card:
    - Fallback Logo: Nếu `logo_url` = null, hiển thị Avatar với Initials của tên trường (VD: HUST) + background màu ngẫu nhiên nhưng ổn định (dựa trên ID).
    - Tên trường
    - Thành phố (`location_city`)
    - Loại trường (`public`/`private`/`international`)
    - Trạng thái dữ liệu: Nếu `verification_status` = `PENDING_VERIFICATION`, hiển thị Badge màu vàng nhạt "Chờ xác thực".
    - CTA: "Xem thông tin tuyển sinh" → Điều hướng sang `/universities/[uni-slug]`
- **Trạng thái:**
  - `Empty State` (Ngành chưa có trường nào): Text "Chưa có dữ liệu trường được xác thực cho ngành này." (Tuyệt đối không hiển thị list trống hay mock data). Kèm CTA: "Quay lại danh sách ngành".

---

## 4. Màn hình Chi tiết Trường (`/universities/[uni-slug]`)

**Mục tiêu:** Hiển thị thông tin tổng quan của trường, làm cầu nối để thêm Mục tiêu (Goal).

- **Header & Nhận diện (Identity):**
  - Cover Image (Fallback nếu null).
  - Logo trường (Fallback dùng Initials nếu null).
  - Tên trường chính thức.
  - Short name (Mã trường).
- **Thông tin cơ bản:**
  - Tỉnh/Thành phố.
  - Loại trường.
  - Website chính thức (Có link ra ngoài mở tab mới).
  - Mô tả (Description): Nếu null → Ẩn hoàn toàn, không sinh AI giả.
- **Nguồn gốc dữ liệu (Provenance):**
  - Hiển thị một footnote nhỏ: "Nguồn dữ liệu: [Link tới Website / Tuyển sinh]" (Dựa trên `source` và `source_url`).
  - Trạng thái xác thực.
- **Danh sách Ngành đào tạo (Programs/Majors):**
  - Liệt kê các ngành mà trường có đào tạo (Lọc ra những ngành thuộc 50 Majors của hệ thống).
- **Call-to-Action Chính:**
  - Nút to, rõ ràng: **"Thêm vào lộ trình"** hoặc **"Đặt mục tiêu"**.
  - Khi click → Gọi Action lưu Goal và điều hướng qua `/roadmap`.
- **Trạng thái Empty/Lỗi:**
  - Nếu trường không tồn tại → Trang 404 Not Found rõ ràng.
