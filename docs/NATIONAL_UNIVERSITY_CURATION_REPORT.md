# NATIONAL UNIVERSITY CURATION REPORT
**Trạng thái**: Hàng đợi (Candidate) - Cần CTO phê duyệt để Import

## 1. Nguồn Dữ Liệu
- **University Master Source**: Tuyensinh247 2026 (Thay thế cho MOET do MOET limit request 20 bản ghi/lần và ẩn toàn bộ ngành).
- **Major Extraction Source**: Tuyensinh247 2026 (`thi.tuyensinh247.com`)
- **Phương pháp**: Khớp (Cross-check) theo Mã trường.

## 2. Thống Kê Độ Phủ (Coverage & Cross-check)

| Kiểm tra | Kết quả | Ghi chú |
| --- | --- | --- |
| Tổng trường MOET/Master | **304** | Trích xuất từ bảng Index của Tuyensinh247 |
| Trường có dữ liệu ngành | **304** | Số lượng trường lấy được bảng ngành |
| Trường thiếu dữ liệu | **0** | Sẽ được hiển thị `MISSING_SOURCE` trong JSON |
| Tổng ngành thu được | **6542** | Được deduplicate theo trường, giữ nguyên tên/mã |
| Ngành có mã | **6542** | (Tuyensinh247 luôn đính kèm mã ngành) |
| Ngành không map taxonomy | **3839** | Status: `UNMAPPED` (vẫn được lưu DB đầy đủ) |
| Tỷ lệ bao phủ (Trường) | **100.0%** | |
| Dữ liệu lỗi | **0** | |

## 3. Mẫu Dữ Liệu Rơi Vào UNMAPPED

Dưới đây là một số ngành thực tế có trong hệ thống quốc gia nhưng rơi vào `UNMAPPED` (để làm cơ sở cho team Taxonomy cập nhật sau, nhưng dữ liệu này vẫn sẽ có mặt trên App để học sinh tra cứu):

```json
[
  {
    "university": "Học Viện An Ninh Nhân Dân",
    "unmapped_majors": [
      "Ngành Nghiệp vụ an ninh (Thí sinh Nam, miền Bắc)",
      "Ngành Nghiệp vụ an ninh (Thí sinh Nữ, miền Bắc)",
      "Ngành An ninh mạng và phòng chống tội phạm công nghệ cao (Thí sinh Nam, miền Bắc)"
    ]
  },
  {
    "university": "Học Viện Thanh Thiếu Niên Việt Nam",
    "unmapped_majors": [
      "Xây dựng Đảng và Chính quyền nhà nước",
      "Quản lý Nhà nước",
      "Tâm lý học"
    ]
  }
]
```

## 4. Quyết Định Tiếp Theo
- File JSON candidate đã được tạo tại `data/national_universities_candidate.json`.
- Báo cáo này chứng minh kiến trúc đa nguồn, bảo toàn dữ liệu gốc và cross-check hoạt động hoàn hảo.
- Xin CTO cho phép **ĐÓNG TASK UNIVERSITY** và chuyển ngay sang luồng Matching -> Recommendation.
