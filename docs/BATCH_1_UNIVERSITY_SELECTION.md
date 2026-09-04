# BATCH 1 UNIVERSITY SELECTION
**Status:** Pending CTO Approval

Tài liệu này đề xuất danh sách 15 trường đại học cho đợt thu thập dữ liệu đầu tiên (Batch 1) nhằm xây dựng University Master Database.

## 1. Mục tiêu và Tiêu chí lựa chọn
Từ 31 trường hiện có trong cơ sở dữ liệu, Batch 1 được chọn lọc dựa trên các tiêu chí sau:
- **Độ phổ biến & Quy mô:** Ưu tiên các trường lớn (Đại học Quốc gia, Bách Khoa, Kinh tế, Y Dược, Sư phạm) có số lượng sinh viên và sự quan tâm lớn.
- **Độ phủ Lĩnh vực (Field Coverage):** Phải đảm bảo danh sách trường bao phủ được tất cả 10 Lĩnh vực (Fields) của hệ thống (Công nghệ, Kinh doanh, Y tế, Giáo dục, Nghệ thuật, Nông lâm, Luật...).
- **Đại diện Vùng miền:** Có sự góp mặt của các trường trọng điểm ở Miền Bắc (Hà Nội), Miền Trung (Đà Nẵng), Miền Nam (TP.HCM, Cần Thơ).
- **Đại diện Loại hình:** Công lập (Public), Tư thục (Private), Quốc tế (International).
- **Tính khả thi xác minh:** Các trường này đều có website chính thức và cổng thông tin tuyển sinh rõ ràng, dễ dàng trích xuất và xác thực dữ liệu.

## 2. Phân tích 31 trường hiện có
Tổng số trường trong DB hiện tại: **31 trường**.
- 22 Công lập
- 7 Tư thục
- 2 Quốc tế

## 3. Đề xuất Danh sách Batch 1 (15 Trường)

| STT | Tên Trường | Mã (Short) | Vùng miền | Loại hình | Lý do chọn & Độ phủ Lĩnh vực dự kiến |
|---|---|---|---|---|---|
| 1 | **Đại học Bách Khoa Hà Nội** | HUST | Miền Bắc | Công lập | Trường kỹ thuật hàng đầu. Bao phủ: Công nghệ & Kỹ thuật. |
| 2 | **Đại học Quốc gia Hà Nội** | VNU-HN | Miền Bắc | Công lập | Đại học đa ngành lớn nhất miền Bắc. Bao phủ: Khoa học, Xã hội, Ngôn ngữ, Kinh tế. |
| 3 | **Đại học Kinh tế Quốc dân** | NEU | Miền Bắc | Công lập | Khối ngành kinh tế hàng đầu. Bao phủ: Kinh doanh & Quản lý. |
| 4 | **Đại học Y Hà Nội** | HMU | Miền Bắc | Công lập | Khối ngành y khoa hàng đầu. Bao phủ: Y tế & Sức khỏe. |
| 5 | **Đại học Sư phạm Hà Nội** | HNUE | Miền Bắc | Công lập | Khối ngành sư phạm hàng đầu. Bao phủ: Giáo dục & Xã hội. |
| 6 | **Đại học Luật Hà Nội** | HLU | Miền Bắc | Công lập | Khối ngành luật hàng đầu. Bao phủ: Luật & Hành chính. |
| 7 | **Đại học Bách Khoa TP.HCM** | HCMUT | Miền Nam | Công lập | Trường kỹ thuật hàng đầu miền Nam. Bao phủ: Công nghệ & Kỹ thuật. |
| 8 | **Đại học Kinh tế TP.HCM** | UEH | Miền Nam | Công lập | Trường đa ngành xu hướng kinh tế/quản lý. Bao phủ: Kinh doanh, Thiết kế, Công nghệ. |
| 9 | **Đại học Y Dược TP.HCM** | UMP | Miền Nam | Công lập | Khối y dược hàng đầu miền Nam. Bao phủ: Y tế & Sức khỏe. |
| 10 | **Đại học Sư phạm TP.HCM** | HCMUE | Miền Nam | Công lập | Khối giáo dục hàng đầu miền Nam. Bao phủ: Giáo dục & Xã hội. |
| 11 | **Đại học Tôn Đức Thắng** | TDTU | Miền Nam | Công lập | Trường đa ngành quy mô lớn, phát triển mạnh. Bao phủ: Kinh doanh, Dịch vụ, Kỹ thuật. |
| 12 | **Đại học FPT TP.HCM** | FPT | Miền Nam | Tư thục | Đại diện khối tư thục mạnh về CNTT. Bao phủ: Công nghệ, Truyền thông, Kinh doanh. |
| 13 | **Đại học RMIT Việt Nam** | RMIT | Miền Nam | Quốc tế | Đại diện khối quốc tế. Bao phủ: Thiết kế, Truyền thông, Kinh doanh. |
| 14 | **Đại học Đà Nẵng** | UD | Miền Trung | Công lập | Đại học vùng trọng điểm miền Trung. Bao phủ: Đa ngành. |
| 15 | **Đại học Cần Thơ** | CTU | Miền Nam | Công lập | Đại học vùng trọng điểm ĐBSCL. Bao phủ đặc biệt: Nông lâm ngư nghiệp, Đa ngành. |

## 4. Phương pháp Xác minh (Khẳng định với CTO)
Đối với 15 trường trên, hệ thống sẽ thực hiện theo chuẩn Pipeline:
- **Xác định Website Chính thức:** Ví dụ `hust.edu.vn`, `neu.edu.vn`.
- **Trích xuất Candidate Majors:** Quét trang tuyển sinh mới nhất (Ví dụ Đề án tuyển sinh 2024/2025/2026).
- **Match taxonomy:** Khớp tên ngành của trường với 50 Majors taxonomy. Tất cả ngành match sẽ có `source_url`.
- **UNMAPPED:** Ghi nhận lại các ngành không khớp vào danh sách candidate để mở rộng taxonomy sau.

Xin CTO duyệt danh sách này để tiến hành Data Extraction ngoại tuyến (offline) và tạo báo cáo `UNIVERSITY_BATCH_1_CURATION_REPORT.md`.
