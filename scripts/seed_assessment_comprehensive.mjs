/**
 * SEED COMPREHENSIVE ASSESSMENT DATA
 * 100% High-Standard Assessment: RIASEC + Big Five + Work Values + Gardner
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbhkrijxgqedcxywuwut.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DIMENSIONS = [
  // RIASEC
  { code: 'R', name: 'Realistic', description: 'Thực tế, thích làm việc với máy móc, công cụ, ngoài trời.', framework: 'riasec' },
  { code: 'I', name: 'Investigative', description: 'Nghiên cứu, thích khám phá, phân tích, giải quyết vấn đề logic.', framework: 'riasec' },
  { code: 'A', name: 'Artistic', description: 'Nghệ thuật, sáng tạo, thích tự do biểu đạt.', framework: 'riasec' },
  { code: 'S', name: 'Social', description: 'Xã hội, thích giúp đỡ, huấn luyện, làm việc với con người.', framework: 'riasec' },
  { code: 'E', name: 'Enterprising', description: 'Mạnh mẽ, thích lãnh đạo, thuyết phục, kinh doanh.', framework: 'riasec' },
  { code: 'C', name: 'Conventional', description: 'Tổ chức, thích làm việc với dữ liệu, chi tiết, quy trình.', framework: 'riasec' },
  // BIG FIVE
  { code: 'O', name: 'Openness', description: 'Sẵn sàng trải nghiệm, sáng tạo, tò mò.', framework: 'big_five' },
  { code: 'C_BF', name: 'Conscientiousness', description: 'Tận tâm, có tổ chức, kỷ luật.', framework: 'big_five' },
  { code: 'EX', name: 'Extraversion', description: 'Hướng ngoại, năng động, thích giao tiếp.', framework: 'big_five' },
  { code: 'AG', name: 'Agreeableness', description: 'Dễ chịu, đồng cảm, hợp tác.', framework: 'big_five' },
  { code: 'EM', name: 'Emotional Stability', description: 'Ổn định cảm xúc, bình tĩnh dưới áp lực.', framework: 'big_five' },
  // WORK VALUES
  { code: 'WV_ACHIEVE', name: 'Achievement', description: 'Coi trọng thành tựu, kết quả, sự ghi nhận.', framework: 'work_values' },
  { code: 'WV_SOCIAL', name: 'Social Service', description: 'Coi trọng việc cống hiến, giúp đỡ cộng đồng.', framework: 'work_values' },
  { code: 'WV_AUTONOMY', name: 'Autonomy', description: 'Coi trọng sự tự do, độc lập trong công việc.', framework: 'work_values' },
  { code: 'WV_SECURITY', name: 'Security', description: 'Coi trọng sự ổn định, chắc chắn, an toàn.', framework: 'work_values' },
  { code: 'WV_CREATIVE', name: 'Creativity', description: 'Coi trọng không gian sáng tạo, đổi mới.', framework: 'work_values' },
  // GARDNER MULTIPLE INTELLIGENCES
  { code: 'MI_LING', name: 'Linguistic', description: 'Trí thông minh ngôn ngữ, nhạy bén với từ ngữ.', framework: 'Gardner' },
  { code: 'MI_LOGIC', name: 'Logical-Mathematical', description: 'Trí thông minh logic-toán học, phân tích.', framework: 'Gardner' },
  { code: 'MI_SPATIAL', name: 'Spatial', description: 'Trí thông minh không gian, hình ảnh.', framework: 'Gardner' },
  { code: 'MI_BODILY', name: 'Bodily-Kinesthetic', description: 'Trí thông minh vận động cơ thể.', framework: 'Gardner' },
  { code: 'MI_MUSICAL', name: 'Musical', description: 'Trí thông minh âm nhạc, giai điệu.', framework: 'Gardner' },
  { code: 'MI_INTER', name: 'Interpersonal', description: 'Trí thông minh tương tác giao tiếp.', framework: 'Gardner' },
  { code: 'MI_INTRA', name: 'Intrapersonal', description: 'Trí thông minh nội tâm, thấu hiểu bản thân.', framework: 'Gardner' },
  { code: 'MI_NATURAL', name: 'Naturalist', description: 'Trí thông minh thiên nhiên, sinh học.', framework: 'Gardner' }
];

// Helper to generate generic 5-point Likert options
function genOptions(questionId, reverse = false) {
  const scores = reverse ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5];
  return [
    { question_id: questionId, option_text: 'Hoàn toàn không đúng', option_value: scores[0], order_index: 1 },
    { question_id: questionId, option_text: 'Không đúng', option_value: scores[1], order_index: 2 },
    { question_id: questionId, option_text: 'Bình thường', option_value: scores[2], order_index: 3 },
    { question_id: questionId, option_text: 'Đúng', option_value: scores[3], order_index: 4 },
    { question_id: questionId, option_text: 'Hoàn toàn đúng', option_value: scores[4], order_index: 5 }
  ];
}

const QUESTIONS = [
  // ==========================================
  // RIASEC (6 types * 7 questions = 42)
  // ==========================================
  { code: 'R', text: 'Tôi thích tự tay lắp ráp hoặc sửa chữa các thiết bị điện tử, máy móc.' },
  { code: 'R', text: 'Tôi thích làm việc ngoài trời hơn là ngồi trong văn phòng suốt ngày.' },
  { code: 'R', text: 'Tôi cảm thấy hứng thú khi tìm hiểu nguyên lý hoạt động của các động cơ.' },
  { code: 'R', text: 'Tôi thích các công việc tay chân, đòi hỏi thể lực hoặc kỹ năng vận động.' },
  { code: 'R', text: 'Tôi thường xuyên tự sửa chữa các vật dụng hỏng hóc trong nhà.' },
  { code: 'R', text: 'Tôi thích sử dụng các công cụ, đồ nghề để tạo ra các sản phẩm vật lý.' },
  { code: 'R', text: 'Tôi quan tâm đến các công việc liên quan đến nông nghiệp, lâm nghiệp hoặc xây dựng.' },

  { code: 'I', text: 'Tôi thích phân tích dữ liệu để tìm ra các quy luật hoặc xu hướng.' },
  { code: 'I', text: 'Tôi thường xuyên đọc các bài báo, tài liệu khoa học hoặc công nghệ.' },
  { code: 'I', text: 'Tôi thích giải quyết các bài toán logic hoặc các câu đố phức tạp.' },
  { code: 'I', text: 'Khi gặp một hiện tượng lạ, tôi luôn muốn tìm hiểu nguyên nhân cốt lõi.' },
  { code: 'I', text: 'Tôi thích thực hiện các thí nghiệm hoặc các dự án nghiên cứu nhỏ.' },
  { code: 'I', text: 'Tôi cảm thấy thỏa mãn khi tìm ra giải pháp tối ưu cho một bài toán khó.' },
  { code: 'I', text: 'Tôi thường tự đặt câu hỏi "Tại sao?" và cố gắng tìm câu trả lời.' },

  { code: 'A', text: 'Tôi thích tự do sáng tạo và không muốn bị gò bó bởi các quy tắc cứng nhắc.' },
  { code: 'A', text: 'Tôi thường xuyên vẽ tranh, làm thơ, viết lách hoặc chơi nhạc cụ.' },
  { code: 'A', text: 'Tôi có khả năng cảm thụ nghệ thuật (âm nhạc, hội họa, văn học) tốt.' },
  { code: 'A', text: 'Tôi thích tham gia các hoạt động biểu diễn hoặc sáng tác.' },
  { code: 'A', text: 'Tôi thường xuyên nảy ra các ý tưởng độc đáo và khác biệt.' },
  { code: 'A', text: 'Tôi thích thiết kế và trang trí không gian sống hoặc làm việc của mình.' },
  { code: 'A', text: 'Tôi dễ bị thu hút bởi những sản phẩm có tính thẩm mỹ cao.' },

  { code: 'S', text: 'Tôi thích giúp đỡ người khác giải quyết các vấn đề cá nhân của họ.' },
  { code: 'S', text: 'Tôi cảm thấy vui vẻ khi hướng dẫn hoặc giảng dạy cho ai đó điều gì mới.' },
  { code: 'S', text: 'Tôi dễ dàng đồng cảm và thấu hiểu cảm xúc của những người xung quanh.' },
  { code: 'S', text: 'Tôi thường xuyên tham gia các hoạt động tình nguyện hoặc cộng đồng.' },
  { code: 'S', text: 'Bạn bè thường tìm đến tôi để xin lời khuyên khi họ gặp khó khăn.' },
  { code: 'S', text: 'Tôi thích làm việc trong môi trường đề cao sự hợp tác và chia sẻ.' },
  { code: 'S', text: 'Tôi quan tâm đến các vấn đề xã hội và muốn đóng góp cho cộng đồng.' },

  { code: 'E', text: 'Tôi thích thuyết phục người khác đồng tình với quan điểm của mình.' },
  { code: 'E', text: 'Tôi có khả năng đưa ra quyết định nhanh chóng trong các tình huống áp lực.' },
  { code: 'E', text: 'Tôi thích đóng vai trò trưởng nhóm hoặc người dẫn dắt trong các dự án.' },
  { code: 'E', text: 'Tôi thường xuyên đặt ra các mục tiêu đầy tham vọng và nỗ lực đạt được.' },
  { code: 'E', text: 'Tôi có hứng thú với việc kinh doanh, khởi nghiệp hoặc quản lý dự án.' },
  { code: 'E', text: 'Tôi không ngại đương đầu với rủi ro để đạt được thành công lớn.' },
  { code: 'E', text: 'Tôi có khả năng tạo động lực và truyền cảm hứng cho người khác.' },

  { code: 'C', text: 'Tôi thích mọi thứ phải được sắp xếp ngăn nắp, có trật tự và quy củ.' },
  { code: 'C', text: 'Tôi làm việc cẩn thận, chú ý đến từng chi tiết nhỏ để tránh sai sót.' },
  { code: 'C', text: 'Tôi thích làm việc với các con số, bảng tính hoặc các báo cáo thống kê.' },
  { code: 'C', text: 'Tôi luôn tuân thủ các quy định, hướng dẫn và quy trình đã được thiết lập.' },
  { code: 'C', text: 'Tôi thường xuyên lập kế hoạch chi tiết cho các công việc hàng ngày.' },
  { code: 'C', text: 'Tôi thích các công việc liên quan đến hành chính, kế toán hoặc lưu trữ dữ liệu.' },
  { code: 'C', text: 'Tôi cảm thấy khó chịu khi mọi người làm việc vô tổ chức hoặc sai quy trình.' },

  // ==========================================
  // BIG FIVE (5 types * 6 questions = 30)
  // ==========================================
  { code: 'O', text: 'Tôi luôn muốn trải nghiệm những điều mới lạ (món ăn mới, vùng đất mới).' },
  { code: 'O', text: 'Tôi có trí tưởng tượng phong phú và thường mơ mộng.' },
  { code: 'O', text: 'Tôi thích thảo luận về các vấn đề triết học hoặc các ý tưởng trừu tượng.' },
  { code: 'O', text: 'Tôi thích sự đa dạng trong cuộc sống hơn là những thói quen lặp đi lặp lại.' },
  { code: 'O', text: 'Tôi thường xuyên tìm hiểu về các nền văn hóa, tôn giáo hoặc hệ tư tưởng khác nhau.' },
  { code: 'O', text: 'Tôi phản đối việc thay đổi và thích mọi thứ giữ nguyên như cũ.', reverse: true },

  { code: 'C_BF', text: 'Tôi luôn hoàn thành nhiệm vụ đúng thời hạn đã cam kết.' },
  { code: 'C_BF', text: 'Tôi thường dọn dẹp phòng ốc và bàn làm việc gọn gàng trước khi bắt đầu.' },
  { code: 'C_BF', text: 'Tôi làm việc một cách có hệ thống và theo đúng kế hoạch đã định.' },
  { code: 'C_BF', text: 'Tôi rất chú trọng đến chất lượng và sự hoàn hảo trong công việc.' },
  { code: 'C_BF', text: 'Tôi ít khi trì hoãn các công việc quan trọng.' },
  { code: 'C_BF', text: 'Tôi thường bỏ cuộc giữa chừng khi gặp khó khăn.', reverse: true },

  { code: 'EX', text: 'Tôi cảm thấy tràn đầy năng lượng khi ở giữa đám đông.' },
  { code: 'EX', text: 'Tôi dễ dàng bắt chuyện với những người hoàn toàn xa lạ.' },
  { code: 'EX', text: 'Tôi thích tham gia các buổi tiệc tùng, sự kiện sôi động.' },
  { code: 'EX', text: 'Tôi thường là người khuấy động bầu không khí trong các cuộc trò chuyện.' },
  { code: 'EX', text: 'Tôi có xu hướng thể hiện cảm xúc và suy nghĩ của mình ra bên ngoài.' },
  { code: 'EX', text: 'Tôi cảm thấy mệt mỏi nếu phải giao tiếp với nhiều người trong thời gian dài.', reverse: true },

  { code: 'AG', text: 'Tôi luôn cố gắng giữ hòa khí và tránh các cuộc xung đột, cãi vã.' },
  { code: 'AG', text: 'Tôi tin tưởng rằng hầu hết mọi người đều có ý tốt.' },
  { code: 'AG', text: 'Tôi sẵn sàng gạt bỏ lợi ích cá nhân để giúp đỡ người khác.' },
  { code: 'AG', text: 'Tôi thường thể hiện sự đồng cảm sâu sắc với nỗi đau của người khác.' },
  { code: 'AG', text: 'Mọi người thường nhận xét tôi là người thân thiện và dễ gần.' },
  { code: 'AG', text: 'Tôi thường nghi ngờ động cơ thực sự đằng sau hành động của người khác.', reverse: true },

  { code: 'EM', text: 'Tôi có thể giữ được bình tĩnh và sáng suốt trong các tình huống khẩn cấp.' },
  { code: 'EM', text: 'Tôi ít khi cảm thấy chán nản hay tuyệt vọng.' },
  { code: 'EM', text: 'Tôi có thể dễ dàng vượt qua những thất bại hoặc sự từ chối.' },
  { code: 'EM', text: 'Cảm xúc của tôi thường duy trì ở mức ổn định, ít khi dao động mạnh.' },
  { code: 'EM', text: 'Tôi thường hay lo lắng về những điều có thể xảy ra trong tương lai.', reverse: true },
  { code: 'EM', text: 'Tôi dễ bị kích động hoặc nổi nóng khi gặp chuyện không như ý.', reverse: true },

  // ==========================================
  // WORK VALUES (5 types * 5 questions = 25)
  // ==========================================
  { code: 'WV_ACHIEVE', text: 'Tôi muốn làm một công việc cho phép tôi phát huy tối đa năng lực cá nhân.' },
  { code: 'WV_ACHIEVE', text: 'Tôi mong muốn đạt được sự ghi nhận và tôn trọng từ đồng nghiệp, cấp trên.' },
  { code: 'WV_ACHIEVE', text: 'Cơ hội thăng tiến và phát triển sự nghiệp là yếu tố cực kỳ quan trọng đối với tôi.' },
  { code: 'WV_ACHIEVE', text: 'Tôi thích cảm giác chiến thắng và vượt qua các thử thách khó khăn.' },
  { code: 'WV_ACHIEVE', text: 'Tôi mong muốn công việc của mình mang lại danh tiếng hoặc vị thế xã hội.' },

  { code: 'WV_SOCIAL', text: 'Tôi muốn công việc của mình mang lại lợi ích thiết thực cho xã hội.' },
  { code: 'WV_SOCIAL', text: 'Được giúp đỡ và cải thiện cuộc sống của người khác là ưu tiên hàng đầu của tôi.' },
  { code: 'WV_SOCIAL', text: 'Tôi ưu tiên làm việc cho các tổ chức phi lợi nhuận hoặc các dự án cộng đồng.' },
  { code: 'WV_SOCIAL', text: 'Tôi cảm thấy hạnh phúc khi thấy người khác thành công nhờ sự hỗ trợ của mình.' },
  { code: 'WV_SOCIAL', text: 'Tôi coi trọng ý nghĩa xã hội của công việc hơn là thu nhập tài chính.' },

  { code: 'WV_AUTONOMY', text: 'Tôi muốn được tự do quyết định cách thức và thời gian làm việc của mình.' },
  { code: 'WV_AUTONOMY', text: 'Tôi không thích bị giám sát chặt chẽ hoặc quản lý vi mô (micromanagement).' },
  { code: 'WV_AUTONOMY', text: 'Tôi muốn làm việc độc lập và tự chịu trách nhiệm về kết quả công việc.' },
  { code: 'WV_AUTONOMY', text: 'Khả năng linh hoạt về không gian và thời gian làm việc rất quan trọng với tôi.' },
  { code: 'WV_AUTONOMY', text: 'Tôi thích tự mình đưa ra các quyết định thay vì phải xin phép cấp trên.' },

  { code: 'WV_SECURITY', text: 'Tôi ưu tiên một công việc có thu nhập ổn định và lâu dài.' },
  { code: 'WV_SECURITY', text: 'Tôi muốn làm việc cho một tổ chức lớn, uy tín và ít có nguy cơ phá sản.' },
  { code: 'WV_SECURITY', text: 'Các chế độ phúc lợi (bảo hiểm, hưu trí, y tế) là yếu tố quyết định khi tôi chọn việc.' },
  { code: 'WV_SECURITY', text: 'Tôi không thích những công việc mang tính rủi ro cao hoặc không chắc chắn.' },
  { code: 'WV_SECURITY', text: 'Tôi mong muốn có một môi trường làm việc rõ ràng, quy trình minh bạch.' },

  { code: 'WV_CREATIVE', text: 'Tôi muốn một công việc cho phép tôi liên tục đưa ra các ý tưởng đổi mới.' },
  { code: 'WV_CREATIVE', text: 'Tôi cảm thấy nhàm chán nếu phải làm đi làm lại một công việc cố định.' },
  { code: 'WV_CREATIVE', text: 'Được tham gia vào quá trình thiết kế, phát triển sản phẩm mới rất hấp dẫn tôi.' },
  { code: 'WV_CREATIVE', text: 'Tôi thích môi trường làm việc cởi mở, khuyến khích sự khác biệt.' },
  { code: 'WV_CREATIVE', text: 'Tôi muốn công việc của mình mang đậm dấu ấn cá nhân.' },

  // ==========================================
  // GARDNER MULTIPLE INTELLIGENCES (8 types * 3 questions = 24)
  // ==========================================
  { code: 'MI_LING', text: 'Tôi rất thích đọc sách, viết lách hoặc kể chuyện.' },
  { code: 'MI_LING', text: 'Tôi có khả năng ghi nhớ thông tin tốt hơn khi đọc hoặc nghe giảng.' },
  { code: 'MI_LING', text: 'Tôi giỏi trong việc diễn đạt suy nghĩ của mình bằng ngôn từ (nói hoặc viết).' },

  { code: 'MI_LOGIC', text: 'Tôi có thể giải các bài toán phức tạp trong đầu một cách nhanh chóng.' },
  { code: 'MI_LOGIC', text: 'Tôi thích các trò chơi đòi hỏi tư duy chiến lược (như cờ vua) hoặc giải đố logic.' },
  { code: 'MI_LOGIC', text: 'Tôi luôn tiếp cận các vấn đề một cách có hệ thống, từng bước một.' },

  { code: 'MI_SPATIAL', text: 'Tôi có thể dễ dàng hình dung không gian 3D hoặc đọc bản đồ tốt.' },
  { code: 'MI_SPATIAL', text: 'Tôi thích phác thảo, vẽ hoặc tạo ra các mô hình trực quan.' },
  { code: 'MI_SPATIAL', text: 'Tôi ghi nhớ sự vật, sự việc tốt hơn khi sử dụng hình ảnh, biểu đồ.' },

  { code: 'MI_BODILY', text: 'Tôi chơi thể thao tốt hoặc có khả năng phối hợp vận động cơ thể linh hoạt.' },
  { code: 'MI_BODILY', text: 'Tôi thích các hoạt động thực hành, "chạm tay vào" (hands-on) hơn là chỉ nghe/nhìn.' },
  { code: 'MI_BODILY', text: 'Tôi sử dụng rất nhiều ngôn ngữ cơ thể, cử chỉ khi giao tiếp.' },

  { code: 'MI_MUSICAL', text: 'Tôi có thể dễ dàng nhận ra các giai điệu, nhịp điệu hoặc nốt nhạc sai.' },
  { code: 'MI_MUSICAL', text: 'Tôi thường xuyên hát nhẩm, gõ nhịp hoặc nghe nhạc trong khi làm việc khác.' },
  { code: 'MI_MUSICAL', text: 'Âm nhạc có thể thay đổi trạng thái cảm xúc của tôi một cách mạnh mẽ.' },

  { code: 'MI_INTER', text: 'Tôi có khả năng đọc được cảm xúc, tâm trạng và động cơ của người khác.' },
  { code: 'MI_INTER', text: 'Tôi thích làm việc nhóm hơn là làm việc một mình.' },
  { code: 'MI_INTER', text: 'Tôi thường xuyên là người hòa giải khi bạn bè hoặc đồng nghiệp xảy ra mâu thuẫn.' },

  { code: 'MI_INTRA', text: 'Tôi hiểu rất rõ về điểm mạnh, điểm yếu và cảm xúc thực sự của chính mình.' },
  { code: 'MI_INTRA', text: 'Tôi thích dành thời gian ở một mình để suy ngẫm hoặc lên kế hoạch cá nhân.' },
  { code: 'MI_INTRA', text: 'Tôi có tính tự lập cao và thường tự định hướng hành động của mình.' },

  { code: 'MI_NATURAL', text: 'Tôi có kiến thức sâu rộng hoặc đam mê về các loài động, thực vật.' },
  { code: 'MI_NATURAL', text: 'Tôi thích tham gia các hoạt động ngoài thiên nhiên như cắm trại, đi bộ đường dài.' },
  { code: 'MI_NATURAL', text: 'Tôi quan tâm sâu sắc đến các vấn đề môi trường và bảo tồn thiên nhiên.' }
];

async function run() {
  console.log('🔄 Bắt đầu dọn dẹp dữ liệu cũ (Assessment Questions & Dimensions)...');
  
  // Wipe out existing data
  await supabase.from('assessment_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('assessment_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('assessment_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('assessment_dimension_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('assessment_question_options').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('assessment_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('assessment_dimensions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // Ensure we have a single published version
  let { data: version } = await supabase.from('assessment_versions').select('id').eq('status', 'published').maybeSingle();
  if (!version) {
    const { data: newV } = await supabase.from('assessment_versions').insert({
      version_tag: '1.0',
      description: 'Comprehensive Assessment V1',
      status: 'published',
      scoring_rules_version: 1
    }).select('id').single();
    version = newV;
  }
  const versionId = version.id;

  console.log('✅ Đã xóa data cũ. Bắt đầu Insert Dimensions...');
  
  const dimensionsToInsert = DIMENSIONS.map(d => ({
    ...d,
    version_id: versionId
  }));

  const { data: dims, error: dimErr } = await supabase
    .from('assessment_dimensions')
    .insert(dimensionsToInsert)
    .select('id, code');
    
  if (dimErr) {
    console.error('Lỗi Insert Dimensions:', dimErr);
    return;
  }
  
  const dimMap = {};
  dims.forEach(d => dimMap[d.code] = d.id);
  
  console.log(`✅ Đã insert ${dims.length} Dimensions.`);
  console.log(`🔄 Bắt đầu Insert ${QUESTIONS.length} Questions...`);

  const questionsToInsert = QUESTIONS.map((q, idx) => ({
    version_id: versionId,
    dimension_id: dimMap[q.code],
    question_text: q.text,
    is_reverse_scored: q.reverse || false,
    order_index: idx + 1
  }));

  const { data: qData, error: qErr } = await supabase
    .from('assessment_questions')
    .insert(questionsToInsert)
    .select('id, question_text');

  if (qErr) {
    console.error('Lỗi Insert Questions:', qErr);
    return;
  }

  console.log(`✅ Đã insert ${qData.length} Questions.`);
  console.log(`🔄 Bắt đầu Insert Options...`);

  let allOptions = [];
  qData.forEach(q => {
    // Find if it was reverse scored
    const origQ = QUESTIONS.find(o => o.text === q.question_text);
    allOptions = allOptions.concat(genOptions(q.id, origQ?.reverse || false));
  });

  // Batch insert options
  const CHUNK_SIZE = 200;
  for (let i = 0; i < allOptions.length; i += CHUNK_SIZE) {
    const chunk = allOptions.slice(i, i + CHUNK_SIZE);
    const { error: optErr } = await supabase.from('assessment_question_options').insert(chunk);
    if (optErr) {
      console.error('Lỗi Insert Options ở chunk', i, optErr);
      return;
    }
  }

  console.log(`✅ Đã insert ${allOptions.length} Options.`);
  console.log('\n🎉 HOÀN TẤT SEEDING 100% TIÊU CHUẨN CAO!');
}

run();
