# Ngân Hàng Câu Hỏi Khảo Sát - 1learn.asia

**Version:** 2026.1
**Ngày khóa kỹ thuật (Locked Date):** 2026-08-29
**Trạng thái:** LOCKED_FOR_IMPLEMENTATION (Đang vận hành thật)
**Đối tượng:** Học sinh THPT, trọng tâm lớp 10–12
**Ngôn ngữ:** vi-VN

---

## 1. PHƯƠNG PHÁP TÍNH ĐIỂM (SCORING LOGIC)
Động cơ tính điểm (Scoring Engine) hoạt động hoàn toàn bằng toán học (Deterministic Math), tuyệt đối KHÔNG SỬ DỤNG LLM để tính điểm.

- **Thang đo:** Likert 5 mức độ (1-5)
  - *RIASEC & Big Five:* 1 (Hoàn toàn không đúng) -> 5 (Rất đúng)
  - *Work Values:* 1 (Hoàn toàn không quan trọng) -> 5 (Cực kỳ quan trọng)
- **Công thức chuẩn hóa (Normalization):**
  - **Nhóm 6 câu (RIASEC, Big Five):** ((Raw Score - 6) / 24) * 100
  - **Nhóm 5 câu (Work Values):** ((Raw Score - 5) / 20) * 100
  - **Nhóm 15 câu (Career Readiness):** ((Raw Score - 15) / 60) * 100
- **Tính đảo ngược (Reverse Scoring):** Tắt toàn bộ ở V2026.1.
- **Tính chất lượng (Quality Control):** 
  - Điểm khởi điểm: 100
  - Rớt câu hỏi bẫy chú ý (Attention Check) -> trừ 20 điểm/lỗi. (Được coi là LỖI nếu trả lời khác đáp án định sẵn).
  - Trả lời 1 đường thẳng (Straight-lining) >= 12 câu liên tiếp -> nghi ngờ, trừ 15 điểm.

---

## 2. NGÂN HÀNG CÂU HỎI (121 CÂU)

### MODULE: RIASEC (36 câu)
| Mã | Câu hỏi |
|---|---|
| R01 | Tôi thích tự tay lắp ráp, sửa chữa hoặc tạo ra một vật thể. |
| R02 | Tôi thích những hoạt động có kết quả cụ thể mà tôi có thể nhìn thấy hoặc kiểm tra được. |
| R03 | Tôi hứng thú với máy móc, thiết bị hoặc công nghệ phần cứng. |
| R04 | Tôi thích học thông qua việc thực hành hơn là chỉ đọc lý thuyết. |
| R05 | Tôi cảm thấy thoải mái khi làm việc với công cụ, thiết bị hoặc vật liệu. |
| R06 | Tôi thích tìm cách vận hành hoặc cải thiện một hệ thống thực tế. |
| I01 | Tôi thích tìm hiểu nguyên nhân đằng sau một hiện tượng. |
| I02 | Tôi thích giải những vấn đề không có câu trả lời ngay lập tức. |
| I03 | Tôi thường muốn biết "vì sao" trước khi chấp nhận một kết luận. |
| I04 | Tôi thích phân tích dữ liệu để tìm ra quy luật. |
| I05 | Tôi hứng thú với khoa học, nghiên cứu hoặc khám phá kiến thức mới. |
| I06 | Tôi thích những nhiệm vụ đòi hỏi suy luận và tư duy logic. |
| A01 | Tôi thích tạo ra những ý tưởng hoặc sản phẩm mang dấu ấn cá nhân. |
| A02 | Tôi hứng thú với thiết kế, hình ảnh, âm nhạc, viết lách hoặc các hình thức sáng tạo. |
| A03 | Tôi thường nghĩ ra nhiều cách khác nhau để thể hiện một ý tưởng. |
| A04 | Tôi thích những công việc cho phép tôi tự do thử nghiệm. |
| A05 | Tôi quan tâm đến vẻ đẹp, cách trình bày và trải nghiệm của người khác. |
| A06 | Tôi cảm thấy hứng thú khi biến một ý tưởng trừu tượng thành sản phẩm cụ thể. |
| S01 | Tôi thích giúp người khác hiểu một vấn đề khó. |
| S02 | Tôi cảm thấy có ý nghĩa khi hỗ trợ người khác tiến bộ. |
| S03 | Tôi thích làm việc cùng người khác hơn là luôn làm việc một mình. |
| S04 | Tôi quan tâm đến cảm xúc và nhu cầu của người khác. |
| S05 | Tôi thích hướng dẫn, dạy học hoặc chia sẻ kiến thức. |
| S06 | Tôi muốn công việc của mình tạo ra tác động tích cực đối với con người. |
| E01 | Tôi thích thuyết phục người khác ủng hộ một ý tưởng. |
| E02 | Tôi thích đứng ra tổ chức hoặc dẫn dắt một nhóm. |
| E03 | Tôi hứng thú với kinh doanh, khởi nghiệp hoặc phát triển dự án. |
| E04 | Tôi thích đặt mục tiêu và tìm cách đạt được chúng. |
| E05 | Tôi cảm thấy hứng thú với những tình huống cần ra quyết định. |
| E06 | Tôi thích trình bày ý tưởng trước người khác. |
| C01 | Tôi thích sắp xếp thông tin theo một hệ thống rõ ràng. |
| C02 | Tôi thích làm việc với bảng biểu, dữ liệu hoặc hồ sơ. |
| C03 | Tôi chú ý đến việc làm đúng quy trình. |
| C04 | Tôi thích những nhiệm vụ có cấu trúc và yêu cầu rõ ràng. |
| C05 | Tôi thường kiểm tra lại công việc để tránh sai sót. |
| C06 | Tôi thích lập kế hoạch và tổ chức công việc theo thứ tự. |

### MODULE: BIG_FIVE (30 câu)
| Mã | Câu hỏi |
|---|---|
| O01 | Tôi thích khám phá những ý tưởng mới. |
| O02 | Tôi thường tò mò về những điều mình chưa biết. |
| O03 | Tôi thích thử những cách tiếp cận khác với cách quen thuộc. |
| O04 | Tôi dễ bị thu hút bởi những chủ đề mới lạ. |
| O05 | Tôi thích tưởng tượng những khả năng khác nhau cho tương lai. |
| O06 | Tôi thích học những lĩnh vực nằm ngoài những gì mình đã quen thuộc. |
| BC01 | Tôi thường hoàn thành việc mình đã cam kết. |
| BC02 | Tôi thích lập kế hoạch trước khi bắt đầu một nhiệm vụ. |
| BC03 | Tôi thường kiểm tra lại công việc trước khi nộp. |
| BC04 | Tôi có thể duy trì nỗ lực ngay cả khi nhiệm vụ trở nên nhàm chán. |
| BC05 | Tôi thường sắp xếp thời gian để hoàn thành mục tiêu. |
| BC06 | Tôi cố gắng làm việc một cách có trách nhiệm. |
| BF_E01 | Tôi cảm thấy có năng lượng khi được giao tiếp với nhiều người. |
| BF_E02 | Tôi thường chủ động bắt chuyện với người mới. |
| BF_E03 | Tôi thích tham gia các hoạt động nhóm. |
| BF_E04 | Tôi cảm thấy khá thoải mái khi nói trước nhiều người. |
| BF_E05 | Tôi thường chủ động thể hiện ý kiến của mình. |
| BF_E06 | Tôi thích những môi trường có nhiều tương tác xã hội. |
| BF_A01 | Tôi cố gắng hiểu quan điểm của người khác trước khi đánh giá họ. |
| BF_A02 | Tôi sẵn sàng hỗ trợ người khác khi họ gặp khó khăn. |
| BF_A03 | Tôi coi trọng sự hợp tác trong nhóm. |
| BF_A04 | Tôi thường cân nhắc cảm xúc của người khác khi đưa ra quyết định. |
| BF_A05 | Tôi thích giải quyết bất đồng bằng cách tìm điểm chung. |
| BF_A06 | Tôi muốn mình là người đáng tin cậy đối với những người xung quanh. |
| N01 | Tôi dễ lo lắng khi có một vấn đề quan trọng xảy ra. |
| N02 | Tôi thường suy nghĩ nhiều về những điều có thể xảy ra. |
| N03 | Tôi dễ cảm thấy căng thẳng khi phải đối mặt với áp lực. |
| N04 | Tôi có thể mất khá nhiều thời gian để bình tĩnh sau một thất bại. |
| N05 | Tôi thường nhạy cảm với những đánh giá tiêu cực. |
| N06 | Tôi dễ bị ảnh hưởng cảm xúc khi kế hoạch của mình không diễn ra như mong đợi. |

### MODULE: WORK_VALUES (30 câu)
| Mã | Câu hỏi |
|---|---|
| WV01 | Tôi muốn công việc cho phép tôi sử dụng tốt năng lực của mình. |
| WV02 | Tôi muốn nhìn thấy kết quả cụ thể từ những gì mình làm. |
| WV03 | Tôi muốn công việc giúp tôi liên tục phát triển năng lực. |
| WV04 | Tôi muốn có những mục tiêu rõ ràng để phấn đấu. |
| WV05 | Tôi muốn cảm thấy mình đang tạo ra thành quả có ý nghĩa. |
| WV06 | Tôi muốn có quyền chủ động trong cách thực hiện công việc. |
| WV07 | Tôi muốn có cơ hội tự đưa ra quyết định. |
| WV08 | Tôi thích môi trường khuyến khích sáng tạo và thử nghiệm. |
| WV09 | Tôi muốn có không gian để phát triển ý tưởng của riêng mình. |
| WV10 | Tôi không muốn công việc kiểm soát quá chặt cách tôi làm việc. |
| WV11 | Tôi muốn những đóng góp của mình được ghi nhận. |
| WV12 | Tôi muốn có cơ hội tiến bộ trong nghề nghiệp. |
| WV13 | Tôi muốn thành tích của mình được đánh giá công bằng. |
| WV14 | Tôi muốn có cơ hội đảm nhận vai trò có trách nhiệm cao hơn. |
| WV15 | Tôi coi trọng việc đạt được vị trí nghề nghiệp mà mình tự hào. |
| WV16 | Tôi muốn làm việc với những người mà mình có thể tin tưởng. |
| WV17 | Tôi muốn công việc tạo cơ hội giúp đỡ người khác. |
| WV18 | Tôi muốn cảm thấy mình thuộc về một tập thể. |
| WV19 | Tôi coi trọng sự hợp tác giữa đồng nghiệp. |
| WV20 | Tôi muốn công việc của mình có ích cho cộng đồng hoặc xã hội. |
| WV21 | Tôi muốn được hướng dẫn khi gặp vấn đề khó. |
| WV22 | Tôi coi trọng một môi trường làm việc tôn trọng nhân viên. |
| WV23 | Tôi muốn nhận được phản hồi để biết mình đang làm tốt đến đâu. |
| WV24 | Tôi muốn làm việc trong một tổ chức có chính sách rõ ràng. |
| WV25 | Tôi coi trọng sự hỗ trợ từ người quản lý và đồng nghiệp. |
| WV26 | Tôi coi trọng sự ổn định trong công việc. |
| WV27 | Tôi muốn công việc có điều kiện làm việc phù hợp với mình. |
| WV28 | Tôi muốn công việc có mức thu nhập phù hợp với mục tiêu của mình. |
| WV29 | Tôi thích công việc có sự đa dạng thay vì lặp lại hoàn toàn. |
| WV30 | Tôi muốn có sự cân bằng hợp lý giữa công việc và cuộc sống. |

### MODULE: CAREER_READINESS (15 câu)
| Mã | Câu hỏi |
|---|---|
| CR01 | Tôi đã bắt đầu tìm hiểu về những nghề nghiệp mà mình quan tâm. |
| CR02 | Tôi biết ít nhất một số ngành học có thể dẫn đến nghề nghiệp mình quan tâm. |
| CR03 | Tôi biết một số trường đại học có chương trình liên quan đến hướng mình đang tìm hiểu. |
| CR04 | Tôi đã từng tìm hiểu yêu cầu tuyển sinh của một ngành hoặc trường mình quan tâm. |
| CR05 | Tôi biết những môn học mình cần chú ý để chuẩn bị cho mục tiêu tương lai. |
| CR06 | Tôi có một hoặc vài mục tiêu học tập cụ thể. |
| CR07 | Tôi biết một số kỹ năng mình cần phát triển. |
| CR08 | Tôi đã từng tham gia hoạt động giúp mình khám phá sở thích hoặc năng lực. |
| CR09 | Tôi thường chủ động tìm thông tin thay vì chỉ chờ người khác hướng dẫn. |
| CR10 | Tôi có thể giải thích tại sao mình quan tâm đến một nghề hoặc ngành học. |
| CR11 | Tôi biết mình còn thiếu gì để tiến gần mục tiêu. |
| CR12 | Tôi có kế hoạch cho những việc mình muốn thực hiện trong thời gian tới. |
| CR13 | Tôi theo dõi tiến độ của những mục tiêu mình đã đặt ra. |
| CR14 | Khi phát hiện kế hoạch không phù hợp, tôi sẵn sàng điều chỉnh. |
| CR15 | Tôi cảm thấy mình đang chủ động khám phá tương lai của mình. |

### MODULE: VALIDITY (10 câu)
| Mã | Câu hỏi |
|---|---|
| VQ_A01 | [ATTENTION CHECK] Để xác nhận bạn đang đọc kỹ câu hỏi, vui lòng chọn "Khá đúng" (4). |
| VQ_A02 | [ATTENTION CHECK] Câu hỏi này yêu cầu bạn chọn "Hoàn toàn không đúng với tôi" (1). Hãy chọn 1 để tiếp tục. |
| VQ_A03 | [ATTENTION CHECK] Để xác nhận bạn đang tập trung, hãy chọn "Rất đúng với tôi" (5). |
| VQ_C01 | Tôi thích tìm hiểu và học hỏi những điều mới. |
| VQ_C02 | Tôi thấy bản thân mình thường thích làm việc theo kế hoạch. |
| VQ_C03 | Tôi cảm thấy hài lòng khi hoàn thành một việc mình đã cam kết. |
| VQ_C04 | Tôi thoải mái khi nói chuyện với người mà tôi mới gặp. |
| VQ_C05 | Tôi nghĩ việc giúp đỡ người khác là điều có ý nghĩa. |
| VQ_C06 | Tôi muốn công việc của mình tạo ra giá trị thực sự. |
| VQ_C07 | Tôi thích môi trường làm việc ổn định và rõ ràng. |

