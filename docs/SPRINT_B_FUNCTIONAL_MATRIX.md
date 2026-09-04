# SPRINT B FUNCTIONAL MATRIX

Đây là ma trận chức năng cho Phase 11 - Sprint B. Tài liệu này đảm bảo mọi tương tác trên giao diện đều được ánh xạ 1:1 với Backend và Database, chấm dứt tình trạng "Mock UI".

> **Core Principle:** A visually complete page is not a completed feature. A feature is complete only when the user can perform its intended action and the system persists and reflects the resulting state correctly.

| Module | Action | UI Component | Backend / Logic | DB Change (State) | Expected Result |
|---|---|---|---|---|---|
| **Explore** | Save / Bookmark | Nút `Bookmark` trong `CareerCard` | Server Action: `toggleSavedItem` | Chèn/Xóa bản ghi trong `student_saved_items` | Nút đổi trạng thái. Khi reload trang, danh sách "Đang cân nhắc" vẫn giữ nguyên dữ liệu. |
| **Explore** | Đưa vào so sánh | Nút `Đưa vào so sánh` | Client Router thay đổi URL Search Params (`?compare=id1,id2`) | Không đổi DB, chỉ đổi Local URL State | Hiển thị `CompareTray` báo số lượng mục đã chọn (Max 3). |
| **Compare** | Render Data | Bảng so sánh ngang | Query trực tiếp: `careers`, `career_education_paths`, `career_matches` | Không đổi | Render dữ liệu thật, Type-safe tuyệt đối, không dùng mảng rỗng `[]` hay `profiles` chung chung. |
| **Compare** | Chọn làm mục tiêu | Nút `Chọn làm mục tiêu` | Server Action form submit | Set `is_primary = false` cho mục tiêu cũ, `INSERT` mục tiêu mới vào `student_goals` với `is_primary = true` | Redirect sang `/goal`, Context được giữ nguyên và load đúng mục tiêu vừa chọn. |
| **Goal** | Goal Readiness | Khối Progress % và Gaps | Hàm `getGoalReadiness` query `student_goals` JOIN `target_requirements` và map với `academic_records` | Không đổi (Read-only) | Hiển thị 3 loại: Đã đạt, Cần cải thiện, Chưa đủ dữ liệu. Điểm tính bằng thuật toán Weighted Sum. |
| **Journey** | Complete Task | Checkbox (`TaskCheckbox`) ở danh sách Lộ trình | Server Action: `toggleTaskCompletion` | `INSERT`/`DELETE` bản ghi trong `task_completions` | UI update (Line-through), Progress Bar ở Home và Journey tự động tính lại %. Reload vẫn giữ nguyên. |
| **Parent** | View Dashboard | `InsightCard` / `Surface` | Query: `parent_child_links`, `student_goals`, `task_completions` | Không đổi (Read-only) | RLS bảo vệ. Hiển thị "Có gì mới ở con" lấy từ `task_completions`. Thay thế hoàn toàn KPI Đỏ bằng thông điệp Actionable. |

---

## Data Tracing & Validation
Mọi thay đổi trên giao diện đều được Validate tự động thông qua việc Load lại dữ liệu thật (Server Components) sau khi thực hiện Server Actions (revalidatePath). Không có State nào được phép lưu trữ độc lập trên Client (Local State Only) cho các hành động cần Persistence.
