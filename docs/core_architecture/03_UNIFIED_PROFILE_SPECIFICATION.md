# UNIFIED PROFILE SPECIFICATION

*Ngày thực hiện: 31/08/2026*

## 1. VẤN ĐỀ HIỆN TẠI (AS-IS)
- `student_career_profiles.profile_features` hiện tại là một mớ hỗn độn (Bag of numbers). 
- Nó trộn lẫn điểm của TẤT CẢ dimension vào một object JSON phẳng (Ví dụ: `{"R": 90, "I": 80, "BF_O": 70}`). Hệ thống không biết đâu là "Sở thích", đâu là "Tính cách".

## 2. KIẾN TRÚC HỒ SƠ HỢP NHẤT (TO-BE)
> **[DECIDED] Nguyên tắc:** KHÔNG được trộn các điểm thành một điểm tổng duy nhất. Phải phân chia ranh giới rõ ràng giữa các nhóm tính chất.

### 2.1 Cấu trúc Dữ liệu Đề xuất (JSONB)
> **[PROPOSED] Schema cho `profile_features`**
```json
{
  "interests": {
    "framework": "riasec",
    "scores": { "R": 85, "I": 92, "A": 30, "S": 40, "E": 60, "C": 70 },
    "primary_code": "IRC",
    "updated_at": "2026-08-31T00:00:00Z"
  },
  "personality": {
    "framework": "big_five",
    "scores": { "O": 80, "C": 90, "E": 50, "A": 60, "N": 40 },
    "updated_at": "2026-08-31T00:00:00Z"
  },
  "work_values": {
    "framework": "work_values",
    "scores": { "ACHIEVEMENT": 95, "INDEPENDENCE": 80, "SUPPORT": 40 },
    "updated_at": "2026-08-31T00:00:00Z"
  },
  "readiness": {
    "score": 60,
    "level": "intermediate"
  },
  "meta": {
    "validity": "high",
    "source_assessments": ["1learn_career_exploration_v1"]
  }
}
```

## 3. QUY TẮC CẬP NHẬT (PROFILE BUILDER)

> **[DECIDED] Một học sinh làm nhiều assessment khác nhau thì Profile hợp nhất thế nào?**
- Hệ thống hỗ trợ "Patching" (Cập nhật cục bộ). 
- Nếu Học sinh làm bài kiểm tra IQ (Một assessment mới), nó sẽ chỉ thêm field `"cognitive_ability": {...}` vào JSON, không làm mất dữ liệu của `"interests"`.

> **[DECIDED] Một dimension được đo bởi nhiều assessment thì lấy kết quả nào?**
- Ưu tiên 1: Kết quả của Assessment có timestamp mới nhất sẽ **ghi đè** kết quả cũ của cùng dimension.
- Ưu tiên 2: Hệ thống lưu lại lịch sử thay đổi (Snapshot versioning). `student_career_profiles` tạo ra version mới thay vì update đè bản ghi cũ.

> **[PROPOSED] Khi kết quả khảo sát mâu thuẫn nhau thì xử lý thế nào?**
- Do chúng ta ghi đè kết quả bằng Assessment mới nhất, tính mâu thuẫn tạm thời được giải quyết bằng nguyên tắc "Sự thật thuộc về thời điểm gần nhất".
- *(Nâng cao trong tương lai)*: Có thể thêm cờ `conflict_flag: true` nếu điểm số chênh lệch quá 40% giữa 2 lần đo cách nhau dưới 3 tháng, yêu cầu học sinh làm lại phần đó hoặc làm bài phỏng vấn nhỏ.
