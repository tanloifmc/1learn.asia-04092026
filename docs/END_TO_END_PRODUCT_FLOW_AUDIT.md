# END-TO-END PRODUCT FLOW AUDIT

**Ngày Audit:** 2026-08-29
**Mục tiêu:** Kiểm tra chính xác luồng chạy của Học sinh sau khi hoàn thành 121 câu khảo sát, đánh giá Code/Logic/Data thực tế.

---

## I. TỔNG QUAN FLOW (STEP-BY-STEP)

| Step | UI Route / Component | Backend / API Action | DB Tables | Logic / Engine | Data | Status | Blocker |
| ---- | -------------------- | -------------------- | --------- | -------------- | ---- | ------ | ------- |
| **1. Assessment** | `/student/assessment` (AssessmentEngine) | `saveAssessmentResponse` | `assessment_responses` | N/A | 121 questions | 🟢 WORKING | None |
| **2. Submit & Score** | Auto-submit ở câu 121 | `calculateAndCompleteSession` | `assessment_results`, `assessment_result_dimensions` | `calculateScoringV1()` | User responses | 🟢 WORKING | None |
| **3. Profile Snapshot**| N/A (Background process) | `buildStudentProfile` | `student_career_profiles` | RIASEC, BigFive, Values | Normalized scores | 🟢 WORKING | None |
| **4. Career Matching** | N/A (Background process) | `runMatchingEngine` | `match_runs`, `career_matches` | Cosine Similarity (RIASEC) + Weights | 505 Careers | 🟢 WORKING | None |
| **5. Assessment Result**| `/me/bao-cao` | Fetch từ DB | N/A | N/A | Render kết quả | 🟢 WORKING | Link lỗi tới Explorer |
| **6. Career Explorer** | `/explore` (Link sai) / `/careers` (Trang thật) | `searchCareers` | `careers` | Search & Filter | 505 Careers | 🔴 BROKEN | Link `/explore` không tồn tại (Dead-end) |
| **7. Career Detail** | `/careers/[slug]` | Lấy DB | `careers` | Hiển thị thông tin | Chi tiết nghề | 🟢 WORKING | Thiếu link chuyển tiếp sang Major |
| **8. Set Career Goal** | `RoadmapTriggerButton` | `setPrimaryGoalAndGenerateRoadmapAction` | `student_goals` | Update primary goal | N/A | 🟢 WORKING | Chỉ lưu được Career |
| **9. Career → Major** | **Không có UI** | Không có Action gọi | `career_major_mappings` | Bị đứt đoạn | **0 Records** | ⚪ NOT IMPL | Không có UX/UI, Data = 0 |
| **10. Major → Uni** | **Không có UI** | Không có Action gọi | `university_majors` | Bị đứt đoạn | 6 Records | ⚪ NOT IMPL | Không có UI để chọn trường |
| **11. Admission Data** | N/A | N/A | `admission_data` | Bị đứt đoạn | 7 Records | ⚪ NOT IMPL | Không có nơi hiển thị/sử dụng |
| **12. Gap Analysis** | `/goal` | `getGoalReadiness` | `target_requirements`, `academic_records`| Weighted sum | Thiếu data thật | 🟡 DATA BLKD | Trống `academic_records` & `requirements` |
| **13. Roadmap** | `/roadmap` | `RoadmapGenerator` | `roadmaps`, `roadmap_milestones`, `roadmap_tasks` | AI/Template Generator | Tự sinh code | 🟢 WORKING | Chỉ chạy cho Career (Thiếu Major/Uni) |

---

## II. CHI TIẾT LUỒNG TRẢI NGHIỆM

**Học sinh hoàn thành 121 câu → hệ thống làm gì → học sinh nhìn thấy gì → click gì → kết quả gì → bước tiếp theo là gì?**

1. **Submit 121 câu**: Học sinh click câu cuối cùng → `AssessmentEngine` gọi `calculateAndCompleteSession()`.
2. **Hệ thống xử lý**: 
   - `calculateScoringV1` tính điểm RIASEC, BigFive.
   - `save_assessment_result` lưu DB.
   - Gọi `buildStudentProfile()` tạo snapshot.
   - Gọi `runMatchingEngine()` để ra top match với 505 Careers.
3. **Học sinh nhìn thấy gì**: Được redirect sang trang `/me/bao-cao`. Thấy biểu đồ RIASEC, BigFive, Top 3 điểm mạnh, và Top 3 Career phù hợp nhất.
4. **Học sinh click gì**: Ở trang Báo cáo có 2 action chính:
   - Click **"Tìm hiểu lộ trình"** (vào thẳng nghề đó) → Chuyển tới `/goal?careerId=...`.
   - Click **"Khám phá tất cả"** → **LỖI 404 DEAD-END**. Nút này đang trỏ tới `/explore`, nhưng thư mục thật của hệ thống là `/careers`.
5. **Vào chi tiết nghề**: Nếu may mắn vào được `/careers/[slug]`, học sinh đọc thông tin lương, kỹ năng, rồi bấm **"Chọn làm Mục tiêu ưu tiên"** (`RoadmapTriggerButton`).
6. **Lập Roadmap & Goal**: Hệ thống gọi `setPrimaryGoalAndGenerateRoadmapAction(career_id)` và chuyển về trang `/goal`.
7. **BƯỚC TIẾP THEO BỊ ĐỨT (BLOCKER LỚN NHẤT)**:
   - Ở trang `/goal`, hệ thống có hiển thị thông tin "Ngành học", "Trường đại học", nhưng lại ghi là *"Chưa chọn"*.
   - Học sinh **KHÔNG CÓ CÁCH NÀO** click để đi từ Career → chọn Major → chọn University. Toàn bộ UI phần này chưa được xây dựng.
   - Data Backend cũng xác nhận `career_major_mappings` = 0.

---

## III. DATA AUDIT (Kiểm tra chuỗi dữ liệu)

- **Assessment Questions / Responses / Results**: ✅ Dữ liệu thông suốt, lưu trữ chính xác.
- **Student Profile**: ✅ Tạo thành công từ Result.
- **Career Matching**: ✅ So sánh Cosine Similarity chạy tốt với 505 Careers (đã có data).
- **Career → Major Mapping**: ❌ 0 Records. Chuỗi data bị đứt.
- **Major → University Mapping**: ❌ 6 Records. Dữ liệu rác/mock, không đủ dùng.
- **University → Admission**: ❌ 7 Records. Dữ liệu mock, không có logic UI gọi đến.
- **Target Requirements**: ❌ Dữ liệu trống.
- **Academic Records**: ❌ Dữ liệu học sinh chưa có màn hình nhập (Profile > Học tập chưa hoàn thiện). Do đó Gap Analysis (`getGoalReadiness`) luôn báo lỗi thiếu dữ liệu.
- **Roadmap / Tasks**: ✅ Hoạt động. Hệ thống có Engine tự sinh milestone/task dựa trên Career.

---

## IV. TỔNG KẾT TÌNH TRẠNG (CTO VIEW)

### A. WORKING NOW (Đã chạy thật)
- Khảo sát 121 câu (UI + Tính điểm + Lưu DB).
- Career Matching Engine.
- Báo cáo kết quả cá nhân (RIASEC, BigFive).
- Career Detail & Set Career Goal.
- Roadmap Generator (Mức cơ bản cho nghề nghiệp).

### B. BROKEN NOW (Lỗi hiện tại)
- Nút "Khám phá tất cả" tại `/me/bao-cao` và "Đến Bản đồ Khám phá" tại `/goal` trỏ sai link (`/explore` thay vì `/careers`). Đây là lỗi Product Dead-end.

### C. DATA BLOCKERS
- `career_major_mappings` = 0.
- `academic_records` (Điểm của học sinh) chưa có UX thu thập.
- `target_requirements` của các trường/ngành chưa có.

### D. LOGIC RISKS
- UI hiển thị "Khả năng trúng tuyển" (Admission Fit) tại trang `/goal` nhưng backend không có luồng tính toán thực tế cho phần này vì học sinh chưa chọn được trường.

### E. PRODUCT DEAD-ENDS
- Sau khi chọn Career, học sinh bị "mắc kẹt" ở trang Goal/Roadmap. Không có luồng (Wizard/Flow) để tiếp tục lọc Major và chọn University. 

### F. EXACT NEXT STEPS (Đề xuất)
1. **Sửa lỗi link 404 (Immediate Fix):** Đổi toàn bộ href `/explore` thành `/careers`.
2. **Xây dựng luồng Career → Major → University (UI/UX):** Phải tạo giao diện (Wizard) để khi học sinh vào Career, họ thấy danh sách Ngành liên quan → Chọn Ngành → Thấy danh sách Trường dạy ngành đó → Chọn Trường → Ra Goal hoàn chỉnh.
3. **Lấp đầy Data Curation (Data Pipeline):** Dừng làm Infrastructure, bắt đầu fill data thật cho: `Career-Major`, `University-Major`, và `Admission`.
4. **Xây dựng UI nhập điểm học bạ:** Để Gap Analysis có data đầu vào.
