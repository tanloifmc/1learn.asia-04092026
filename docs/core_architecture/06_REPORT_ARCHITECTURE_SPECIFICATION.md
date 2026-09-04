# REPORT ARCHITECTURE SPECIFICATION (FINAL LOCKED)

*Chính sách Kiến trúc Báo cáo Hướng nghiệp 1learn.asia*

## 1. NGUYÊN TẮC CỐT LÕI
1. **Fact-based / Data-driven**: Mọi nhận định trong báo cáo phải xuất phát từ `profile_features` (Unified Profile) thông qua một Interpretation Engine có tính chất tất định (Deterministic).
2. **Phân tầng 2 Cấp (Free vs Premium)**: Không dùng chung một báo cáo bị cắt xén. Free Report và Premium Report phục vụ hai mục đích và trải nghiệm chuyển đổi khác nhau.
3. **Data Dependency Lock**: Tuyệt đối không tạo dữ liệu giả cho các tính năng tương lai (Nghề/Ngành/Trường/Goal). Nếu Engine chưa tồn tại, `status = NOT_AVAILABLE` và `data = []`.

## 2. QUY TẮC AI WRITER (LOCKED)
AI Writer là một công cụ xuất bản ngôn ngữ tự nhiên, không phải một Decision Maker.

### ĐƯỢC PHÉP:
- Chuyển insight thành ngôn ngữ tự nhiên.
- Viết Executive Summary.
- Viết lời giải thích thân thiện với học sinh.
- Điều chỉnh độ dài.
- Sử dụng giọng văn Gen Z nhưng chuyên nghiệp.

### KHÔNG ĐƯỢC PHÉP:
- Không thay đổi score, rank, Holland Code.
- Không tự thêm strength, weakness.
- Không tự tạo career match, major, university, validity, psychological diagnosis.
- Không tự tạo recommendation ngoài Report Data Contract.

## 3. FREE REPORT — "CAREER DISCOVERY SNAPSHOT"
**Mục tiêu duy nhất:** "Tôi hiểu bản thân mình hơn và tôi muốn biết điều này liên quan gì đến nghề/ngành."
Free không được giải quyết đầy đủ câu hỏi "Tôi nên chọn nghề gì?" - đây là boundary thương mại.

### Được mở hoàn toàn:
1. Career Identity
2. RIASEC Primary / Secondary / Holland Code
3. Big Five Working Style
4. Top 3 Work Values
5. Strengths
6. Watch-outs
7. Suitable Environment
8. Executive Snapshot ngắn
9. Teaser Career / Major / University (Không blur giả dữ liệu, chỉ hiển thị thông điệp giới thiệu)

### Không được mở đầy đủ:
- Danh sách nghề được matching, điểm match nghề, lý do match nghề
- Ngành học phù hợp, trường đại học phù hợp
- Gap analysis, roadmap, action plan

## 4. PREMIUM REPORT — "PERSONAL CAREER PROFILE"
**Mục tiêu:** "Với con người này, tôi nên khám phá nghề nào, ngành nào, môi trường nào và cần chuẩn bị gì?"

### Bao gồm 13 Section:
| # | Section | Data source |
|---|---|---|
| 01 | Career Identity | Interpretation |
| 02 | Executive Summary | Report Data + AI Writer |
| 03 | Interest Profile | RIASEC |
| 04 | Personality Profile | Big Five |
| 05 | Work Values | Values |
| 06 | Cross-Dimension Insight | Interpretation Engine |
| 07 | Strengths Map | Interpretation |
| 08 | Development Areas | Interpretation |
| 09 | Suitable Environments | Interpretation |
| 10 | Career Exploration | Career DB + Matching Engine |
| 11 | Major Exploration | Major DB + Matching |
| 12 | University Exploration | University DB + Matching |
| 13 | Goal & Action Plan | Roadmap Engine |
