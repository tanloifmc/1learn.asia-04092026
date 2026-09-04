# INTERPRETATION RULES SPECIFICATION (FINAL LOCKED)

*Chính sách Logic Phân tích Dữ liệu Hướng nghiệp 1learn.asia*

## 1. NGUYÊN TẮC CƠ BẢN
Tuyệt đối KHÔNG sử dụng điểm tuyệt đối để nói "cao/thấp" khi chưa có normative population. Không sử dụng một bộ threshold chung áp đặt cho mọi framework. Mọi đánh giá đều dựa trên "Relative Profiling" (Xếp hạng tương đối trong chính hồ sơ).

> [!IMPORTANT]
> Tất cả các con số hoặc ngưỡng (ví dụ: `+10` hoặc `-10`) trong tài liệu này hoàn toàn là **1learn Product Rule** (Quy tắc diễn giải sản phẩm nội bộ của 1learn), tuyệt đối KHÔNG phải là một chuẩn tâm lý học (psychological norm) chuẩn hóa trên dân số chung. Các kỹ sư không được phép ngộ nhận hoặc chú thích các ngưỡng này như một chẩn đoán khoa học phổ quát.

## 2. RIASEC — RELATIVE PROFILING
Không có ngưỡng High/Medium/Low. Điểm chỉ dùng để xếp hạng.

### Quy tắc (Rules):
1. **Rank**: Xếp 6 dimension (R, I, A, S, E, C) theo normalized score giảm dần.
2. **Tie-breaking**: KHÔNG dùng trọng số câu hỏi. Nếu có hai nhóm cùng normalized score, ưu tiên theo thứ tự cố định: `I → R → A → S → E → C`.
3. **Holland Code**: Lấy Top 3 sau khi đã rank và tie-break.

## 3. BIG FIVE — WITHIN-PROFILE
Không dùng quy tắc Top 2 cứng. Không ép buộc gán nhãn nếu không có cơ sở so sánh với trung bình bản thân.

### Quy tắc (Rules):
1. **Rank**: Xếp O, C, E, A, N theo normalized score.
2. **Tính Mean**: Tính khoảng cách với trung bình profile `M = mean(O,C,E,A,N)`. Tính `D = score - M`.
3. **Phân nhóm** *(Dựa trên 1learn Product Rule Thresholds)*:
   - `Prominent`: `D >= +10`
   - `Lower`: `D <= -10`
   - `Moderate`: `-10 < D < +10`
4. **Bảo vệ**:
   - Nếu không có dimension nào đạt `+10`, không được ép dimension cao nhất thành "Prominent".
   - Nếu không có dimension nào `<= -10`, không được tạo "Lower".
5. **Diễn giải**: Chỉ được kết luận đặc điểm tính cách tương quan trong chính bản thân (Ví dụ: "Trong hồ sơ của bạn, O nổi bật hơn đáng kể so với mức trung bình của các đặc điểm còn lại").

## 4. WORK VALUES — RANKING
Sử dụng Ranking, không dùng High/Medium/Low tuyệt đối.

### Quy tắc (Rules):
1. **Top Values**: Lấy Top 3 cho báo cáo.
2. **Tie-breaking**: Nếu có tie ở vị trí thứ 3, dùng deterministic order cố định: `Achievement → Independence → Recognition → Relationships → Support → Working Conditions`. (Không dùng trọng số tùy ý).
3. **Hiển thị**: Premium hiển thị toàn bộ ranking, Free chỉ hiển thị Top 3.

## 5. CROSS-DIMENSION INSIGHTS
- AI **không được tự phát hiện pattern**.
- Engine chỉ được phát hiện pattern từ các rule đã định nghĩa cứng trong kiến trúc.
- Nếu chưa có rule tương ứng, mảng `patterns = []`. Không được dùng LLM để "nhìn profile rồi nghĩ ra pattern".
