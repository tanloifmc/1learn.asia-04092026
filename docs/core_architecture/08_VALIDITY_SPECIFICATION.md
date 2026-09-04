# VALIDITY SPECIFICATION (FINAL LOCKED)

*Chính sách Quản trị Chất lượng Dữ liệu Hướng nghiệp 1learn.asia*

## 1. NGUYÊN TẮC CƠ BẢN
Không loại bỏ học sinh chỉ vì một tín hiệu đơn lẻ. Sử dụng đa chỉ báo (Attention Check, Speeding, Straight-lining) để phân định 4 trạng thái tính hợp lệ. Mọi ngưỡng đưa ra là **1learn Product Quality Threshold**, không phải chuẩn tâm lý tuyệt đối.

## 2. ATTENTION CHECK POLICY
1. **0 failures**: `PASS`
2. **1 failure**: `QUESTIONABLE`
3. **≥2 failures**: `INVALID`

## 3. SPEEDING POLICY
Đối với các câu hỏi (scored items) có recorded response time:
- Ngưỡng đánh dấu: `response_time < 2 seconds` → `speeding_flag = true`

**Aggregate rule:**
1. Tỷ lệ tốc độ `speeding_items >= 20%` và `< 40%`: `QUESTIONABLE`
2. Tỷ lệ tốc độ `speeding_items >= 40%`: `INVALID`
3. Tỷ lệ tốc độ `< 20%`: `PASS`

## 4. STRAIGHT-LINING POLICY
Trong một block có ít nhất **8 scored Likert items liên tiếp**:
- Ngưỡng đánh dấu: Nếu cùng một option được chọn `>= 8 items liên tiếp` → `straightline_flag = true`

**Aggregate rule:**
1. 1 block: `QUESTIONABLE`
2. ≥2 blocks: `INVALID`

## 5. FINAL VALIDITY MATRIX
Đây là bảng chân lý để Engine xác định kết quả Validity cuối cùng.

| Condition | Final Status |
|---|---|
| Missing required metadata (e.g., thiếu expected answer, thiếu thời gian) | **UNDETERMINED** |
| 0 attention failures + no serious quality flag | **VALID** |
| 1 attention failure | **QUESTIONABLE** |
| ≥2 attention failures | **INVALID** |
| Speeding ≥20% and <40% | **QUESTIONABLE** |
| Speeding ≥40% | **INVALID** |
| 1 straightline block | **QUESTIONABLE** |
| ≥2 straightline blocks | **INVALID** |
| Any explicit package-defined invalid condition | **INVALID** |
| Conflicting / insufficient metadata preventing evaluation | **UNDETERMINED** |

> [!IMPORTANT]
> **Quy tắc Metadata Bắt buộc:** Nếu hệ thống thiếu metadata để đánh giá Validity (ví dụ: package chưa khai báo `attention expected answer`, `straight-line block config`, hoặc DB không ghi nhận `response_time`), kết quả BẮT BUỘC phải là **UNDETERMINED**. Cấm tuyệt đối hành vi developer tự lấy giá trị mặc định để fallback thành `VALID`. 

**Precedence (Độ ưu tiên giải quyết khi có xung đột):**
Nếu nhiều điều kiện xảy ra, xét độ ưu tiên từ trên xuống dưới:
`UNDETERMINED` > `INVALID` > `QUESTIONABLE` > `VALID`

## 6. REPORT ELIGIBILITY
Quy tắc mở khóa dữ liệu cho học sinh, đặc biệt UNDETERMINED không được phép xử lý như VALID.

| Validity | Free Report | Premium Report | UI |
|---|---|---|---|
| **VALID** | ✅ Được phép | ✅ Được phép | Bình thường |
| **QUESTIONABLE** | ✅ Được phép | ⚠️ Có cảnh báo | Hiển thị Warning |
| **INVALID** | ❌ Bị khóa | ❌ Bị khóa | Yêu cầu làm lại |
| **UNDETERMINED** | ❌ Bị khóa | ❌ Bị khóa | "Chưa đủ dữ liệu để xác nhận kết quả" |
