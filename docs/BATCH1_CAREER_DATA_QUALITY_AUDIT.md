# BATCH 1 CAREER DATA QUALITY AUDIT
**Dataset:** `data/raw/batch1_careers.json`
**Total Records:** 301
**Audit Date:** 2026-09-03

---

## 1. SOURCE AUDIT & CATEGORIES
*Tất cả 301 records đều có trường `source.url` và `source.evidence` hợp lệ theo Schema. Dưới đây là phân loại nguồn thực tế dựa trên domain URL:*

- **VIETNAM_PROFESSIONAL** (Nguồn tuyển dụng uy tín: ITviec, TopCV, CareerViet, JobsGO...): **226** records
- **VIETNAM_EDUCATION** (Trường đại học/Viện nghiên cứu `.edu.vn`): **2** records
- **OFFICIAL_VIETNAM** (Nguồn chính phủ `.gov.vn`): **0** records
- **INTERNATIONAL** (Các domain quốc tế, diễn đàn, hoặc nền tảng không đuôi .vn): **73** records
- **SECONDARY / INVALID**: **0** records

**Đánh giá:** Nguồn dữ liệu chủ yếu đến từ các trang tuyển dụng lớn nhất Việt Nam. Tuy nhiên, vẫn có 73 nguồn dẫn từ các trang web quốc tế hoặc nền tảng việc làm chung chung.

---

## 2. VIETNAM RELEVANCE
*Dựa trên chỉ thị "Chỉ chấp nhận dữ liệu có bối cảnh Việt Nam":*

- **VERIFIED_VIETNAM**: **228** records *(URL thuộc domain Việt Nam hoặc nền tảng tuyển dụng nội địa như itviec, careerviet).*
- **PLAUSIBLE_VIETNAM**: **40** records *(URL quốc tế nhưng trong phần `evidence` có đề cập rõ ràng đến ngữ cảnh Việt Nam).*
- **INTERNATIONAL_ONLY**: **33** records *(URL quốc tế và evidence hoàn toàn không nhắc đến bối cảnh Việt Nam. Ví dụ: CAR_SEMI_03, CAR_MECHA_01).*
- **UNSUPPORTED**: **0** records.

> [!WARNING]
> Theo chỉ thị CTO, **chỉ có 228 records (VERIFIED_VIETNAM)** là đáp ứng tuyệt đối tiêu chuẩn Production. 33 records (INTERNATIONAL_ONLY) bắt buộc phải loại bỏ. 40 records (PLAUSIBLE) cần cân nhắc loại bỏ hoặc duyệt tay.

---

## 3. SOURCE CONCENTRATION
*Phân tích xem có URL nào bị "tái sử dụng" quá nhiều để chứng minh cho hàng loạt nghề hay không:*

**Top URL được sử dụng nhiều nhất:**
1. `https://careerviet.vn/viec-lam/supply-chain-k-vi.html` - **17 records**
2. `https://jobsgo.vn/blog/bao-cao-thi-truong-viec-lam-nam-2025/` - **12 records**
3. `https://itviec.com/report/vietnam-it-salary-and-recruitment-market` - **10 records**
4. `https://careerviet.vn/jobs/bank-finance-k-sortdv-en.html` - **9 records**

**Đánh giá:** Có hiện tượng Perplexity dùng chung 1 đường link danh mục (ví dụ danh mục Supply Chain của CareerViet) làm nguồn (evidence) cho 17 nghề nghiệp khác nhau trong mảng Logistics. Mặc dù các nghề này thực sự tồn tại ở Việt Nam, nhưng việc 1 URL chứng minh cho 17 nghề cho thấy AI đã "ăn gian" việc tìm kiếm URL riêng lẻ cho từng nghề.

---

## 4. CAREER TAXONOMY QUALITY
*Kiểm tra cấu trúc và phân loại nghề nghiệp:*

- **Trùng lặp (Duplicate):** Phát hiện 1 trường hợp trùng lặp tiếng Anh: `Internal Auditor` bị gán cho 2 mã là **CAR_LAW_08** và **CAR_ECO_12**.
- **Tên nghề quá dài / Chứa cả tiếng Anh:** Có khoảng 40 nghề bị AI chèn thêm tiếng Anh vào ngoặc đơn trong tên tiếng Việt.
  *Ví dụ:* `Kỹ sư thiết kế vi mạch số (Digital IC Design Engineer)` - Cần cắt bỏ phần trong ngoặc để chuẩn hóa Taxonomy.
- Không phát hiện trường hợp lấy ngành học (Major) thay cho nghề nghiệp (Career).

---

## 5. RIASEC CHECK
- Toàn bộ 301 records đều có `riasec_code = null`.
- AI tuân thủ tuyệt đối quy tắc không tự bịa mã Holland.

---

## 6. CAREERS REQUIRING REJECTION
Danh sách 33 nghề có bằng chứng yếu (INTERNATIONAL_ONLY) bắt buộc phải **REJECT**:
`CAR_SEMI_03`, `CAR_SEMI_07`, `CAR_SEMI_08`, `CAR_MECHA_01`, `CAR_HVAC_01`, `CAR_MAINT_01`, `CAR_CNC_01`, `CAR_PHARM_03`, `CAR_NURSE_01`, `CAR_TECH_01`, `CAR_TECH_02`, `CAR_TECH_05`, `CAR_AGRI_03`, `CAR_FOOD_07`, `CAR_FOREST_01`, `CAR_PROC_01`, `CAR_LAW_05`, `CAR_LAW_15`, `CAR_LAW_16`, `CAR_DESIGN_02`, `CAR_DESIGN_04`, `CAR_DESIGN_05`, `CAR_MEDIA_02`, `CAR_MEDIA_03`, `CAR_MEDIA_04`, `CAR_MEDIA_05`, `CAR_DESIGN_07`, `CAR_MEDIA_06`, `CAR_MEDIA_08`, `CAR_DESIGN_10`, `CAR_MEDIA_09`, `CAR_DESIGN_11`, `CAR_HOS_13`.

---

## 7. FINAL RECOMMENDATION

**Status:** `BLOCKED` (Đối với toàn bộ file 301 records).

**Giải pháp đề xuất để tiến hành Import:**
1. **Lọc dữ liệu (Filter):** Viết script loại bỏ hoàn toàn 33 records nhóm `INTERNATIONAL_ONLY`. Xử lý tay hoặc loại luôn 40 records `PLAUSIBLE_VIETNAM` nếu muốn giữ chất lượng khắt khe nhất (chỉ lấy 228 records).
2. **Chuẩn hóa Taxonomy (Normalize):** Loại bỏ trùng lặp mã (giữ 1 `Internal Auditor`), xóa các cụm tiếng Anh trong ngoặc đơn của tên tiếng Việt (ví dụ: `(Digital IC Design Engineer)`).
3. **Import:** Sau khi lọc và chuẩn hóa, tiến hành import khoảng ~220 nghề đạt chuẩn `VERIFIED_VIETNAM` vào database.

Đề nghị CTO phê duyệt phương án **Lọc + Chuẩn hóa tự động** trước khi Import.
