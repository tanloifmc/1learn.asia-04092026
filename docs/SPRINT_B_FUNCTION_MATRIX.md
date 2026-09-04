# SPRINT B FUNCTION MATRIX

| Module | User Goal | Visible Functions | Backend/Data Source | Primary CTA | State Change |
| --- | --- | --- | --- | --- | --- |
| **Explore** | Tìm hướng | Search / Filter / Save / Recommended / All | `careers`, `majors`, `universities`, `career_matches` | So sánh | Cập nhật danh sách Considering/Saved |
| **Compare** | Ra quyết định | Add / Remove / Compare max 3 / Match scores / Gaps | `career_matches`, `profiles` | Chọn mục tiêu | Context đẩy sang /goal |
| **Goal** | Xác lập mục tiêu | Career / Major / Uni / Readiness / Target Year | `student_goals`, `target_requirements` | Tạo lộ trình | Dữ liệu thật ghi vào `student_goals` |
| **Journey** | Hành động | Tasks / Progress / Milestones / Deadlines / Why | `roadmaps`, `task_completions` | Hoàn thành | Dữ liệu thật ghi vào `task_completions` -> cập nhật Milestone -> Home |
| **Parent** | Đồng hành | Summary / What changed / Support suggestions / Privacy | `parent_child_links`, `task_completions`, `student_goals` | Xem tiến độ | Phụ huynh chỉ Read-only, không sửa dữ liệu |
