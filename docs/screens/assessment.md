# Screen Contract: Assessment (`/assessment/take`)

## Purpose
Giao diện để học sinh thực hiện bài trắc nghiệm tâm lý/định hướng (121 câu hỏi). Môi trường cần sự tập trung cao độ, không xao nhãng.

## User
- **Học sinh:** Đã đăng nhập, cần hoàn thành bài test để nhận báo cáo cá nhân.

## Primary Goal
Hoàn thành 121 câu hỏi một cách trung thực nhất, ít mệt mỏi nhất.

## Inputs
- Câu trả lời cho từng câu hỏi (Scale 1-5 hoặc tương tự).
- Hành động: Chọn đáp án, Chuyển câu, Lưu và Thoát, Nộp bài.

## Outputs
- Trạng thái hoàn thành (Progress bar).
- Các câu hỏi được nhóm theo trang/module để giảm tải nhận thức.

## Actions
- `Select Answer`: Chọn một mức độ đồng ý/không đồng ý.
- `Next/Prev`: Chuyển đổi giữa các nhóm câu hỏi.
- `Save & Exit`: Lưu trạng thái `in_progress` để làm tiếp sau.
- `Submit`: Gửi toàn bộ đáp án (chỉ khi hoàn thành 100%).

## Data Source
- **Read:** `assessment_questions` (Load câu hỏi), `assessment_sessions` (Trạng thái session hiện tại).
- **Write:** `assessment_responses` (Lưu nháp từng câu hoặc batch), `assessment_results` (Khi submit).

## States
- **Intro:** Giới thiệu luật, số lượng câu, thời gian dự kiến.
- **In Progress:** Đang trả lời (hiển thị progress bar).
- **Submitting:** Loading state khi tính toán kết quả.
- **Completed:** Chuyển hướng sang màn hình Kết quả.

## CTA
- "Bắt đầu làm bài"
- "Tiếp tục"
- "Nộp bài và xem kết quả"

## Privacy
- Chỉ học sinh (auth.uid) và hệ thống chấm điểm được quyền xem `assessment_responses`.
- Không hiển thị bất kỳ thông tin nào của học sinh khác.
