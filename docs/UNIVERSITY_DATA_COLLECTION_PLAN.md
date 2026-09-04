# UNIVERSITY DATA COLLECTION PLAN
**Version:** 1.0 (MVP)
**Mục tiêu:** Định hướng chiến lược thu thập dữ liệu trường đại học đợt 1 (Batch 1), ưu tiên chất lượng và khả năng vận hành của hệ thống thay vì số lượng.

---

## 1. Nguyên tắc Không Thỏa hiệp
- **Không suy diễn (No Hallucination):** AI và con người tuyệt đối KHÔNG ĐƯỢC tự bịa ra website, mô tả, hay liên kết ngành-trường.
- **Có nguồn gốc (Source Required):** Chỉ chấp nhận thông tin đến từ website chính thức của trường (`.edu.vn`, v.v.), hoặc từ Đề án tuyển sinh công bố chính thức. Tuyệt đối không lấy dữ liệu từ các trang báo mạng tổng hợp thiếu kiểm chứng và coi đó là Official.
- **Tuân thủ Pipeline:** Quy trình phải đi qua các bước: `RAW` → `NORMALIZE` → `DEDUPLICATE` → `SOURCE CHECK` → `CURATE` → `VERIFY` → `PUBLISH`. AI chỉ được phép đóng vai trò hỗ trợ trích xuất (Extract) và tạo bản ghi thô (Candidate), cờ `verified` phải do con người hoặc quy trình xác thực chặt chẽ quyết định.

---

## 2. Ưu tiên Thu thập Dữ liệu (Prioritization)

### Nhóm P0 - Bắt buộc (Phục vụ lõi vận hành MVP)
1. **Canonical identity:** Tên trường chính xác, viết tắt, mã trường.
2. **Official website:** URL trang chủ chính thức của trường.
3. **City/Province:** Địa điểm cơ sở chính.
4. **Source & Verification:** Nguồn tham khảo và trạng thái xác thực.
5. **University ↔ Major (Thật):** Bằng chứng trường có tuyển sinh/đào tạo ngành học tương ứng. Đây là xương sống nối luồng "Khám phá Lĩnh vực".

### Nhóm P1 - Nâng cao (Làm đẹp UI sau khi P0 hoàn tất)
6. **Admissions website:** Trang web chuyên biệt về tuyển sinh (nếu có).
7. **Address:** Địa chỉ chi tiết.
8. **Logo:** URL logo chất lượng cao. (Nếu không có, fallback UI tự tạo chữ cái đầu).
9. **Description:** Đoạn văn giới thiệu ngắn về trường.

---

## 3. Phạm vi Curation Đợt 1 (Batch 1)

Thay vì cào toàn bộ 300+ trường đại học Việt Nam, **Batch 1 chỉ tập trung vào một tập hợp đủ nhỏ nhưng chất lượng cao** để chứng minh luồng Khám phá hoạt động.

### Tiêu chí chọn trường Batch 1:
- Thuộc nhóm các trường đại học lớn, phổ biến, được học sinh quan tâm nhiều.
- Cung cấp đa dạng ngành học phủ qua nhiều Field khác nhau (để test Field → Major → University logic).
- Có Website chính thức rõ ràng, dễ truy cập để xác thực thông tin.
- Có đầy đủ thông tin tuyển sinh công khai.

### Mục tiêu số lượng Batch 1:
- Chọn lọc **10 - 15 trường đại học** từ 31 trường hiện có trong cơ sở dữ liệu.
- Map **30 - 50 quan hệ Trường ↔ Ngành (University-Major)** cho các trường này, sử dụng chính xác danh sách 50 Majors hiện tại.
- Đảm bảo mỗi Major phổ biến có ít nhất 1-2 trường đại học để UI không bị trạng thái "Trống".

---

## 4. Phương pháp Thực thi Batch 1

1. **Chuẩn bị Schema:** Thêm cột `website` và các cột Provenance vào DB (theo `UNIVERSITY_MASTER_DATA_SPECIFICATION.md`).
2. **Data Extraction (AI-Assisted):**
   - Sử dụng các công cụ tìm kiếm và duyệt web để tìm website chính thức của tập 15 trường được chọn.
   - Quét trang tuyển sinh để lập danh sách ngành học của từng trường.
3. **Data Mapping:**
   - So khớp danh sách ngành học thu được với 50 Majors hiện có trong hệ thống 1learn.asia.
   - Ghi nhận `source_url` cho mỗi quan hệ khớp thành công.
4. **Data Verification:**
   - Đánh dấu bản ghi là `CURATED` / `VERIFIED`.
5. **Data Import:**
   - Dùng SQL script hoặc tool nội bộ đẩy dữ liệu đã xác thực vào database.

---

## 5. Quản lý Orphan Universities

- **Đối với 25 trường chưa có ngành trong DB hiện tại:** Tuyệt đối không xóa.
- **Hành động:** Đánh dấu trạng thái của chúng là `INCOMPLETE` hoặc `PENDING_VERIFICATION`.
- **Hiển thị:** Các trường này sẽ không xuất hiện trong luồng `/majors/[slug]` cho đến khi được bổ sung quan hệ University ↔ Major ở các Batch tiếp theo. Hệ thống UI phải xử lý việc ẩn các trường `INCOMPLETE` khỏi public view.
