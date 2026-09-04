# FIELD → MAJOR TAXONOMY
**Tài liệu Curated Taxonomy — MVP 1learn.asia**

> **Nguyên tắc tạo tài liệu này:**
> - Mapping dựa trên tên ngành học tiếng Việt và bản chất nghề nghiệp thực tế.
> - Mapping không phải AI suy đoán từ text — đây là taxonomy do người chịu trách nhiệm xác nhận.
> - Mỗi Major được gán **1 Field chính** (primary). Các ngành có thể liên quan đến nhiều Field được ghi chú.
> - Schema hiện tại (`majors.field_id`) là **1:1**. Xem phần cuối để quyết định có cần chuyển sang nhiều-nhiều không.

---

## Danh sách Fields (10 Fields)

| ID | Slug | Tên tiếng Việt |
|----|------|-----------------|
| 07c6a27e | `cong-nghe-ky-thuat` | Công nghệ & Kỹ thuật |
| 54a2a663 | `kinh-doanh-quan-ly` | Kinh doanh & Quản lý |
| ea9548db | `thiet-ke-sang-tao` | Thiết kế & Sáng tạo |
| 158abc60 | `truyen-thong-bao-chi` | Truyền thông & Báo chí |
| 6cdf8047 | `khoa-hoc-nghien-cuu` | Khoa học & Nghiên cứu |
| 4790277b | `giao-duc-xa-hoi` | Giáo dục & Xã hội |
| 97c98fbf | `y-te-suc-khoe` | Y tế & Sức khỏe |
| ffa8b3d7 | `luat-hanh-chinh` | Luật & Hành chính |
| a146023f | `dich-vu-du-lich` | Dịch vụ & Du lịch |
| d3d00c93 | `nong-lam-ngu-nghiep` | Nông lâm ngư nghiệp |

---

## Mapping 50 Majors → Fields

### 🟦 Công nghệ & Kỹ thuật (`07c6a27e`)
> **Lý do:** Các ngành này tập trung vào ứng dụng công nghệ số, phần mềm, hệ thống thông tin, bảo mật và trí tuệ nhân tạo.

| Major | Slug | Field cũ (text) | Rationale | Multi-field? |
|-------|------|-----------------|-----------|--------------|
| An toàn thông tin | `an-toan-thong-tin` | Technology | An ninh mạng, phần mềm | ✗ |
| Công nghệ thông tin | `cong-nghe-thong-tin` | Technology | Ngành CNTT cốt lõi | ✗ |
| Hệ thống thông tin | `he-thong-thong-tin` | Technology | Quản lý hệ thống IT | ✗ |
| Khoa học dữ liệu | `khoa-hoc-du-lieu` | Technology | Data + lập trình | ⚠️ Cũng liên quan Khoa học & Nghiên cứu |
| Khoa học máy tính | `khoa-hoc-may-tinh` | Technology | CS cốt lõi | ✗ |
| Kỹ thuật phần mềm | `ky-thuat-phan-mem` | Technology | Software engineering | ✗ |
| Trí tuệ nhân tạo | `tri-tue-nhan-tao` | Technology | AI/ML | ⚠️ Cũng liên quan Khoa học & Nghiên cứu |
| Thương mại điện tử | `thuong-mai-dien-tu` | Business | Intersection CNTT+KD | ⚠️ Cũng liên quan Kinh doanh & Quản lý |

### 🟨 Công nghệ & Kỹ thuật — Kỹ thuật ngành (`07c6a27e`)
> **Lý do:** Các ngành kỹ thuật công nghệ truyền thống — cơ khí, điện, điện tử, xây dựng.

| Major | Slug | Field cũ (text) | Rationale | Multi-field? |
|-------|------|-----------------|-----------|--------------|
| Kỹ thuật cơ khí | `ky-thuat-co-khi` | Engineering | Kỹ thuật truyền thống | ✗ |
| Kỹ thuật điện | `ky-thuat-dien` | Engineering | Kỹ thuật điện | ✗ |
| Kỹ thuật điện tử viễn thông | `ky-thuat-dien-tu-vien-thong` | Engineering | Electronics/Telecom | ✗ |
| Kỹ thuật hóa học | `ky-thuat-hoa-hoc` | Engineering | Hóa kỹ thuật | ⚠️ Cũng liên quan Khoa học & Nghiên cứu |
| Kỹ thuật môi trường | `ky-thuat-moi-truong` | Engineering | Môi trường + kỹ thuật | ⚠️ Cũng liên quan Khoa học & Nghiên cứu |
| Kỹ thuật xây dựng | `ky-thuat-xay-dung` | Engineering | Civil engineering | ✗ |

### 🟩 Kinh doanh & Quản lý (`54a2a663`)
> **Lý do:** Kinh doanh, tài chính, quản trị, logistics là những ngành thuần thuộc nhóm Kinh doanh.

| Major | Slug | Field cũ (text) | Rationale | Multi-field? |
|-------|------|-----------------|-----------|--------------|
| Bảo hiểm | `bao-hiem` | Business | Tài chính/rủi ro | ✗ |
| Kế toán | `ke-toan` | Business | Accounting | ✗ |
| Kiểm toán | `kiem-toan` | Business | Auditing | ✗ |
| Kinh tế học | `kinh-te-hoc` | Business | Economics | ✗ |
| Kinh tế quốc tế | `kinh-te-quoc-te` | Business | International economics | ✗ |
| Logistics và Quản lý chuỗi cung ứng | `logistics-chuoi-cung-ung` | Business | Supply chain | ✗ |
| Marketing | `marketing` | Business | Marketing | ✗ |
| Quản trị kinh doanh | `quan-tri-kinh-doanh` | Business | Business admin | ✗ |
| Tài chính Ngân hàng | `tai-chinh-ngan-hang` | Business | Finance/Banking | ✗ |

### 🎨 Thiết kế & Sáng tạo (`ea9548db`)
> **Lý do:** Các ngành sáng tạo thị giác, thiết kế ứng dụng, kiến trúc không gian.

| Major | Slug | Field cũ (text) | Rationale | Multi-field? |
|-------|------|-----------------|-----------|--------------|
| Kiến trúc | `kien-truc` | Design | Architecture — sáng tạo + kỹ thuật | ⚠️ Cũng liên quan Công nghệ & Kỹ thuật |
| Mỹ thuật ứng dụng | `my-thuat-ung-dung` | Design | Applied arts | ✗ |
| Thiết kế đồ họa | `thiet-ke-do-hoa` | Design | Graphic design | ✗ |
| Thiết kế nội thất | `thiet-ke-noi-that` | Design | Interior design | ✗ |

### 📡 Truyền thông & Báo chí (`158abc60`)
> **Lý do:** Ngành giao tiếp, truyền thông, báo chí, media.

| Major | Slug | Field cũ (text) | Rationale | Multi-field? |
|-------|------|-----------------|-----------|--------------|
| Báo chí | `bao-chi` | Humanities | Journalism | ✗ |
| Truyền thông đa phương tiện | `truyen-thong-da-phuong-tien` | Humanities | Multimedia/Media | ✗ |

### 🔬 Khoa học & Nghiên cứu (`6cdf8047`)
> **Lý do:** Khoa học tự nhiên, sinh học, môi trường — thiên về nghiên cứu.

| Major | Slug | Field cũ (text) | Rationale | Multi-field? |
|-------|------|-----------------|-----------|--------------|
| Công nghệ sinh học | `cong-nghe-sinh-hoc` | Science | Biotech — nghiên cứu | ✗ |
| Khoa học môi trường | `khoa-hoc-moi-truong` | Science | Environmental science | ✗ |

### 📚 Giáo dục & Xã hội (`4790277b`)
> **Lý do:** Sư phạm, xã hội học, tâm lý, ngôn ngữ, quan hệ quốc tế — phục vụ cộng đồng và con người.

| Major | Slug | Field cũ (text) | Rationale | Multi-field? |
|-------|------|-----------------|-----------|--------------|
| Công tác xã hội | `cong-tac-xa-hoi` | Social | Social work | ✗ |
| Giáo dục Mầm non | `giao-duc-mam-non` | Education | Early childhood ed. | ✗ |
| Ngôn ngữ Anh | `ngon-ngu-anh` | Humanities | Linguistics/EFL | ✗ |
| Ngôn ngữ Nhật | `ngon-ngu-nhat` | Humanities | Linguistics/Japanese | ✗ |
| Ngôn ngữ Trung Quốc | `ngon-ngu-trung-quoc` | Humanities | Linguistics/Chinese | ✗ |
| Quan hệ quốc tế | `quan-he-quoc-te` | Social | Int'l relations | ✗ |
| Sư phạm Tiếng Anh | `su-pham-tieng-anh` | Education | Teacher training EFL | ✗ |
| Sư phạm Toán học | `su-pham-toan-hoc` | Education | Math teacher training | ✗ |
| Tâm lý học | `tam-ly-hoc` | Social | Psychology | ✗ |

### 🏥 Y tế & Sức khỏe (`97c98fbf`)

| Major | Slug | Field cũ (text) | Rationale | Multi-field? |
|-------|------|-----------------|-----------|--------------|
| Điều dưỡng | `dieu-duong` | Health | Nursing | ✗ |
| Dược học | `duoc-hoc` | Health | Pharmacy | ✗ |
| Răng Hàm Mặt | `rang-ham-mat` | Health | Dentistry | ✗ |
| Y khoa | `y-khoa` | Health | Medicine | ✗ |

### ⚖️ Luật & Hành chính (`ffa8b3d7`)

| Major | Slug | Field cũ (text) | Rationale | Multi-field? |
|-------|------|-----------------|-----------|--------------|
| Luật | `luat` | Law | Law | ✗ |
| Luật kinh tế | `luat-kinh-te` | Law | Commercial law | ⚠️ Cũng liên quan Kinh doanh & Quản lý |

### ✈️ Dịch vụ & Du lịch (`a146023f`)

| Major | Slug | Field cũ (text) | Rationale | Multi-field? |
|-------|------|-----------------|-----------|--------------|
| Quản trị dịch vụ du lịch lữ hành | `quan-tri-du-lich-lu-hanh` | Business | Tourism management | ✗ |
| Quản trị khách sạn | `quan-tri-khach-san` | Business | Hospitality | ✗ |

### 🌾 Nông lâm ngư nghiệp (`d3d00c93`)

| Major | Slug | Field cũ (text) | Rationale | Multi-field? |
|-------|------|-----------------|-----------|--------------|
| Nông nghiệp | `nong-nghiep` | Agriculture | Agriculture | ✗ |
| Thú y | `thu-y` | Agriculture | Veterinary | ✗ |

---

## ⚠️ Các Ngành cần quyết định về Multi-Field

Các ngành sau đây trong thực tế **có thể phù hợp với nhiều hơn 1 Field**, nhưng schema hiện tại (`majors.field_id`) chỉ hỗ trợ **1:1**:

| Major | Field Chính (đề xuất) | Field Phụ liên quan |
|-------|-----------------------|---------------------|
| Khoa học dữ liệu | Công nghệ & Kỹ thuật | Khoa học & Nghiên cứu |
| Trí tuệ nhân tạo | Công nghệ & Kỹ thuật | Khoa học & Nghiên cứu |
| Thương mại điện tử | Kinh doanh & Quản lý | Công nghệ & Kỹ thuật |
| Kỹ thuật hóa học | Công nghệ & Kỹ thuật | Khoa học & Nghiên cứu |
| Kỹ thuật môi trường | Công nghệ & Kỹ thuật | Khoa học & Nghiên cứu |
| Kiến trúc | Thiết kế & Sáng tạo | Công nghệ & Kỹ thuật |
| Luật kinh tế | Luật & Hành chính | Kinh doanh & Quản lý |

### ➡️ Khuyến nghị Schema

> **Đối với MVP:** Giữ nguyên `field_id` 1:1 vì nó đủ đơn giản và không chặn flow khám phá. Các ngành multi-field được gán vào **Field Chính** theo bảng trên. Khi cần multi-field sau này, tạo bảng junction `major_fields` thay vì sửa schema hiện tại.

---

## Mapping Status

- **Tổng số Majors:** 50
- **Đã mapping (trong tài liệu này):** 50
- **Cần verify trước khi write DB:** ✅ Tài liệu này là bước xác nhận
- **Trạng thái:** `CURATED — Pending CTO approval`
- **Ngày tạo:** 2026-08-29
- **Người tạo:** Antigravity (from DB dump — không phải text matching, dựa trên bản chất ngành)

> **QUAN TRỌNG:** Tài liệu này chỉ có hiệu lực sau khi CTO xem xét và phê duyệt. Chưa ghi vào Database.
