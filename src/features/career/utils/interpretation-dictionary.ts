export interface InterpretationBand {
  id: string;
  min?: number;
  max?: number;
  label: 'high' | 'medium' | 'low';
}

export interface InterpretationRule {
  level: 'high' | 'medium' | 'low' | 'prominent' | 'moderate' | 'lower';
  meaning: string;
  evidence: string;
  insight: string;
  strengths: string[];
  watch_outs: string[];
  environments: string[];
}

export interface InterpretationFramework {
  bands: InterpretationBand[];
  dimensions: Record<string, InterpretationRule[]>;
}

export type InterpretationDictionary = Record<string, InterpretationFramework>;

const PROVISIONAL_BANDS: InterpretationBand[] = [
  { id: 'high', min: 70, label: 'high' },
  { id: 'medium', min: 40, max: 70, label: 'medium' },
  { id: 'low', max: 40, label: 'low' }
];

export const INTERPRETATION_DICT: InterpretationDictionary = {
  riasec: {
    bands: PROVISIONAL_BANDS,
    dimensions: {
      R: [
        {
          level: 'high',
          meaning: 'Sở thích Thực hành cao',
          evidence: 'Điểm số rất cao ở nhóm Thực hành (Realistic).',
          insight: 'Bạn thích làm việc với máy móc, công cụ, thực vật hoặc động vật hơn là làm việc với dữ liệu hay con người.',
          strengths: ['Khéo léo trong các công việc thủ công hoặc kỹ thuật', 'Suy nghĩ thực tế và giải quyết vấn đề trực tiếp', 'Phù hợp với các công việc đòi hỏi vận động'],
          watch_outs: ['Có thể thiếu kiên nhẫn với các lý thuyết trừu tượng dài dòng'],
          environments: ['Môi trường làm việc thực địa, ngoài trời hoặc trong phòng thí nghiệm thực hành', 'Môi trường tập trung vào kết quả vật lý cụ thể']
        },
        {
          level: 'medium',
          meaning: 'Sở thích Thực hành trung bình',
          evidence: 'Điểm số trung bình ở nhóm Thực hành (Realistic).',
          insight: 'Bạn có thể làm các công việc thực tế khi cần thiết, nhưng đây không phải là sở thích số một.',
          strengths: ['Linh hoạt trong việc áp dụng kỹ năng thực tế khi được yêu cầu'],
          watch_outs: [],
          environments: ['Môi trường làm việc kết hợp giữa văn phòng và thực địa']
        },
        {
          level: 'low',
          meaning: 'Sở thích Thực hành thấp',
          evidence: 'Điểm số thấp ở nhóm Thực hành (Realistic).',
          insight: 'Bạn ít hứng thú với các công việc đòi hỏi tay chân, sửa chữa hay tương tác vật lý.',
          strengths: [],
          watch_outs: ['Tránh các công việc thuần tay chân hoặc lặp đi lặp lại về mặt vật lý'],
          environments: ['Môi trường làm việc trong nhà, thiên về trí óc và dữ liệu']
        }
      ],
      I: [
        {
          level: 'high',
          meaning: 'Sở thích Phân tích cao',
          evidence: 'Điểm số rất cao ở nhóm Phân tích (Investigative).',
          insight: 'Bạn thích tìm hiểu nguyên nhân cốt lõi, làm việc với dữ liệu và hệ thống thay vì cảm tính.',
          strengths: ['Tư duy logic và phân tích sắc bén', 'Khả năng giải quyết vấn đề phức tạp', 'Ham học hỏi và nghiên cứu chuyên sâu'],
          watch_outs: ['Có thể dễ bị sa đà vào chi tiết mà quên đi bức tranh tổng thể', 'Đôi khi thiếu sự gắn kết cảm xúc với đồng nghiệp'],
          environments: ['Môi trường học thuật, nghiên cứu hoặc phân tích dữ liệu chuyên sâu', 'Nơi đề cao tính logic, độc lập và sự thật khách quan']
        },
        {
          level: 'medium',
          meaning: 'Sở thích Phân tích trung bình',
          evidence: 'Điểm số trung bình ở nhóm Phân tích.',
          insight: 'Bạn có khả năng phân tích tốt ở mức độ áp dụng thực tiễn.',
          strengths: ['Tư duy mạch lạc, có thể hiểu và ứng dụng kết quả nghiên cứu'],
          watch_outs: [],
          environments: ['Môi trường có sự cân bằng giữa ra quyết định dựa trên dữ liệu và kinh nghiệm']
        },
        {
          level: 'low',
          meaning: 'Sở thích Phân tích thấp',
          evidence: 'Điểm số thấp ở nhóm Phân tích.',
          insight: 'Bạn thiên về trực giác và cảm xúc hơn là các phân tích số liệu lạnh lùng.',
          strengths: ['Hành động nhanh chóng dựa trên trực giác', 'Khả năng nắm bắt tình huống không qua số liệu'],
          watch_outs: ['Cần cẩn thận với các quyết định quan trọng thiếu cơ sở dữ liệu vững chắc'],
          environments: ['Môi trường làm việc năng động, dựa nhiều vào trực giác và kinh nghiệm thực tiễn']
        }
      ],
      A: [
        {
          level: 'high',
          meaning: 'Sở thích Sáng tạo cao',
          evidence: 'Điểm số rất cao ở nhóm Sáng tạo (Artistic).',
          insight: 'Bạn đam mê sự đổi mới, yêu thích thiết kế, nghệ thuật và sự tự do bộc lộ bản thân.',
          strengths: ['Khả năng sáng tạo và thẩm mỹ tốt', 'Ý tưởng phong phú, đột phá', 'Có khả năng truyền cảm hứng cho người khác qua các tác phẩm'],
          watch_outs: ['Dễ chán nản với các công việc lặp đi lặp lại hoặc có tính quy trình cứng nhắc'],
          environments: ['Môi trường đề cao sự tự do bộc lộ cá nhân và sáng tạo', 'Không gian làm việc linh hoạt, ít gò bó về mặt quy chuẩn']
        },
        {
          level: 'medium',
          meaning: 'Sở thích Sáng tạo trung bình',
          evidence: 'Điểm số trung bình ở nhóm Sáng tạo.',
          insight: 'Bạn trân trọng cái đẹp và sự sáng tạo, thích những điểm nhấn đổi mới trong công việc.',
          strengths: ['Cởi mở với các ý tưởng mới và có gu thẩm mỹ tốt'],
          watch_outs: [],
          environments: ['Môi trường cho phép đóng góp ý tưởng đổi mới dù công việc chính có tính quy trình']
        },
        {
          level: 'low',
          meaning: 'Sở thích Sáng tạo thấp',
          evidence: 'Điểm số thấp ở nhóm Sáng tạo.',
          insight: 'Bạn ưa thích sự rõ ràng, cấu trúc và tính thực dụng hơn là những ý tưởng bay bổng.',
          strengths: ['Làm việc thực tế và bám sát quy trình', 'Tạo ra kết quả ổn định, có thể dự đoán được'],
          watch_outs: [],
          environments: ['Môi trường làm việc có cấu trúc rõ ràng, quy trình chuẩn mực']
        }
      ],
      S: [
        {
          level: 'high',
          meaning: 'Sở thích Xã hội cao',
          evidence: 'Điểm số rất cao ở nhóm Xã hội (Social).',
          insight: 'Bạn thích làm việc, giúp đỡ, dạy dỗ hoặc chữa lành cho người khác.',
          strengths: ['Thấu cảm và thấu hiểu người khác sâu sắc', 'Kỹ năng giao tiếp và xây dựng mối quan hệ xuất sắc', 'Khả năng hòa đồng và làm việc nhóm cực tốt'],
          watch_outs: ['Dễ bị ôm đồm cảm xúc của người khác dẫn đến quá tải', 'Có thể gặp khó khăn khi phải đưa ra các quyết định kỷ luật cứng rắn'],
          environments: ['Môi trường làm việc tập trung vào con người như giáo dục, y tế hoặc dịch vụ xã hội', 'Văn hóa tổ chức đề cao sự hợp tác và hỗ trợ lẫn nhau']
        },
        {
          level: 'medium',
          meaning: 'Sở thích Xã hội trung bình',
          evidence: 'Điểm số trung bình ở nhóm Xã hội.',
          insight: 'Bạn sẵn sàng tương tác và giúp đỡ khi cần, nhưng cũng cần không gian riêng.',
          strengths: ['Biết cách cân bằng giữa việc hỗ trợ người khác và hoàn thành mục tiêu cá nhân'],
          watch_outs: [],
          environments: ['Môi trường làm việc nhóm có sự phân công trách nhiệm cá nhân rõ ràng']
        },
        {
          level: 'low',
          meaning: 'Sở thích Xã hội thấp',
          evidence: 'Điểm số thấp ở nhóm Xã hội.',
          insight: 'Bạn tập trung vào công việc, dữ liệu hoặc máy móc nhiều hơn là chăm sóc người khác.',
          strengths: ['Khả năng làm việc độc lập cao', 'Giữ được sự khách quan trong các quyết định'],
          watch_outs: ['Cần chú ý tới khía cạnh con người và kỹ năng mềm khi làm việc trong nhóm'],
          environments: ['Môi trường làm việc độc lập, ít yêu cầu tương tác xã hội liên tục']
        }
      ],
      E: [
        {
          level: 'high',
          meaning: 'Sở thích Lãnh đạo cao',
          evidence: 'Điểm số rất cao ở nhóm Lãnh đạo (Enterprising).',
          insight: 'Bạn thích dẫn dắt, thuyết phục, bán hàng hoặc quản lý các nguồn lực để đạt mục tiêu.',
          strengths: ['Quyết đoán và tự tin trong các tình huống thử thách', 'Kỹ năng thuyết phục và đàm phán tốt', 'Có năng lực dẫn dắt và truyền động lực cho tập thể'],
          watch_outs: ['Có thể thiếu kiên nhẫn với các quy trình chậm chạp', 'Đôi khi có xu hướng áp đặt ý kiến lên người khác'],
          environments: ['Môi trường kinh doanh, bán hàng hoặc quản lý với nhịp độ nhanh', 'Nơi có cơ hội thăng tiến rõ ràng và được trao quyền tự quyết']
        },
        {
          level: 'medium',
          meaning: 'Sở thích Lãnh đạo trung bình',
          evidence: 'Điểm số trung bình ở nhóm Lãnh đạo.',
          insight: 'Bạn có thể nắm vai trò quản lý khi cần thiết nhưng không nhất thiết phải luôn là người dẫn đầu.',
          strengths: ['Có khả năng quản lý dự án và điều phối nguồn lực ở mức tốt'],
          watch_outs: [],
          environments: ['Môi trường làm việc chuyên nghiệp, có cơ hội thăng tiến dần dần']
        },
        {
          level: 'low',
          meaning: 'Sở thích Lãnh đạo thấp',
          evidence: 'Điểm số thấp ở nhóm Lãnh đạo.',
          insight: 'Bạn thích làm chuyên môn hơn là phải thuyết phục hay quản lý người khác.',
          strengths: ['Tập trung cao độ vào việc phát triển chuyên môn sâu', 'Không bị phân tâm bởi các vấn đề chính trị công sở'],
          watch_outs: [],
          environments: ['Môi trường đề cao năng lực chuyên gia (Specialist) hơn là quản lý (Manager)']
        }
      ],
      C: [
        {
          level: 'high',
          meaning: 'Sở thích Tổ chức cao',
          evidence: 'Điểm số rất cao ở nhóm Tổ chức (Conventional).',
          insight: 'Bạn thích làm việc với dữ liệu, con số, quy trình rõ ràng và chi tiết.',
          strengths: ['Làm việc vô cùng cẩn thận và tỉ mỉ', 'Kỹ năng tổ chức, sắp xếp công việc xuất sắc', 'Là người rất đáng tin cậy trong việc tuân thủ quy định'],
          watch_outs: ['Có thể trở nên cứng nhắc và sợ sự thay đổi bất ngờ', 'Khó thích ứng với môi trường làm việc thiếu định hướng rõ ràng'],
          environments: ['Môi trường làm việc có hệ thống, quy trình và luật lệ rõ ràng', 'Công việc liên quan đến xử lý số liệu, tài chính hoặc hành chính chi tiết']
        },
        {
          level: 'medium',
          meaning: 'Sở thích Tổ chức trung bình',
          evidence: 'Điểm số trung bình ở nhóm Tổ chức.',
          insight: 'Bạn tuân thủ quy tắc khi cần thiết nhưng vẫn muốn một chút linh hoạt.',
          strengths: ['Biết cách tổ chức công việc cơ bản mà không quá gò bó'],
          watch_outs: [],
          environments: ['Môi trường làm việc có hệ thống nhưng vẫn cho phép sự linh động nhất định']
        },
        {
          level: 'low',
          meaning: 'Sở thích Tổ chức thấp',
          evidence: 'Điểm số thấp ở nhóm Tổ chức.',
          insight: 'Bạn không thích sự gò bó của các quy trình lặp đi lặp lại hoặc công việc bàn giấy.',
          strengths: ['Tính linh hoạt cao và khả năng thích ứng nhanh với môi trường mới'],
          watch_outs: ['Cần rèn luyện tính cẩn thận với giấy tờ và các thủ tục hành chính'],
          environments: ['Môi trường làm việc năng động, không yêu cầu theo dõi quá nhiều quy trình lặp lại']
        }
      ]
    }
  },
  big_five: {
    bands: PROVISIONAL_BANDS,
    dimensions: {
      BF_O: [
        { level: 'prominent', meaning: 'Mức độ Cởi mở cao', evidence: 'Điểm số cao hơn trung bình nhiều ở nhóm Cởi mở (Openness).', insight: 'Bạn rất tò mò, sáng tạo và luôn thích khám phá những trải nghiệm, ý tưởng mới mẻ.', strengths: ['Sáng tạo và giàu trí tưởng tượng', 'Dễ dàng tiếp thu các quan điểm mới'], watch_outs: ['Dễ bị phân tâm bởi quá nhiều ý tưởng mới'], environments: ['Môi trường làm việc không gò bó, khuyến khích tư duy đột phá'] },
        { level: 'moderate', meaning: 'Mức độ Cởi mở trung bình', evidence: 'Điểm số ở mức trung bình ở nhóm Cởi mở.', insight: 'Bạn cởi mở với những điều mới nhưng vẫn coi trọng những giá trị truyền thống đã được chứng minh.', strengths: ['Cân bằng giữa sự đổi mới và tính thực tiễn'], watch_outs: [], environments: [] },
        { level: 'lower', meaning: 'Mức độ Cởi mở thấp', evidence: 'Điểm số thấp hơn trung bình nhiều ở nhóm Cởi mở.', insight: 'Bạn thích sự quen thuộc, truyền thống và các quy trình đã được thiết lập rõ ràng.', strengths: ['Thực tế và có xu hướng gắn bó với những phương pháp đáng tin cậy'], watch_outs: ['Có thể gặp khó khăn khi môi trường thay đổi quá đột ngột'], environments: ['Môi trường làm việc truyền thống, ổn định và ít thay đổi bất ngờ'] },
      ],
      BF_C: [
        { level: 'prominent', meaning: 'Mức độ Tận tâm cao', evidence: 'Điểm số cao hơn trung bình nhiều ở nhóm Tận tâm (Conscientiousness).', insight: 'Bạn rất có kỷ luật, tự giác và luôn đặt tinh thần trách nhiệm lên hàng đầu.', strengths: ['Trách nhiệm cao và vô cùng đáng tin cậy', 'Kỷ luật cá nhân xuất sắc'], watch_outs: ['Đôi khi quá cầu toàn dẫn đến căng thẳng'], environments: ['Môi trường làm việc chuyên nghiệp, đòi hỏi sự chỉn chu và đúng hạn'] },
        { level: 'moderate', meaning: 'Mức độ Tận tâm trung bình', evidence: 'Điểm số ở mức trung bình ở nhóm Tận tâm.', insight: 'Bạn có trách nhiệm ở mức khá nhưng đôi khi vẫn muốn sự linh hoạt, không quá nguyên tắc.', strengths: ['Biết cách hoàn thành công việc mà không tự tạo quá nhiều áp lực'], watch_outs: [], environments: [] },
        { level: 'lower', meaning: 'Mức độ Tận tâm thấp', evidence: 'Điểm số thấp hơn trung bình nhiều ở nhóm Tận tâm.', insight: 'Bạn có lối sống tự phát, ít lên kế hoạch dài hạn và thích sự ngẫu hứng.', strengths: ['Linh hoạt và dễ dàng thay đổi hướng đi khi cần thiết'], watch_outs: ['Dễ trễ hạn hoặc bỏ lỡ các chi tiết quan trọng'], environments: ['Môi trường làm việc linh động, tập trung vào kết quả ngắn hạn hơn là quy trình dài hạn'] },
      ],
      BF_E: [
        { level: 'prominent', meaning: 'Mức độ Hướng ngoại cao', evidence: 'Điểm số cao hơn trung bình nhiều ở nhóm Hướng ngoại (Extraversion).', insight: 'Bạn hướng ngoại, nạp năng lượng từ các hoạt động xã hội và thích là tâm điểm của sự chú ý.', strengths: ['Năng nổ, nhiệt tình trong giao tiếp', 'Dễ dàng mở rộng mạng lưới quan hệ'], watch_outs: ['Dễ cảm thấy chán nản hoặc tụt năng lượng khi phải làm việc một mình quá lâu'], environments: ['Môi trường làm việc có tính tương tác cao, thường xuyên giao tiếp với con người'] },
        { level: 'moderate', meaning: 'Hướng trung (Ambivert)', evidence: 'Điểm số ở mức trung bình ở nhóm Hướng ngoại.', insight: 'Bạn là người hướng trung (ambivert), có thể linh hoạt điều chỉnh năng lượng tùy theo hoàn cảnh.', strengths: ['Cân bằng tốt giữa việc tương tác xã hội và làm việc độc lập'], watch_outs: [], environments: ['Môi trường làm việc kết hợp, có cả không gian tương tác và không gian yên tĩnh'] },
        { level: 'lower', meaning: 'Mức độ Hướng nội cao', evidence: 'Điểm số thấp hơn trung bình nhiều ở nhóm Hướng ngoại.', insight: 'Bạn hướng nội, nạp năng lượng trong không gian riêng và thích những tương tác chiều sâu.', strengths: ['Khả năng tập trung sâu sắc', 'Biết lắng nghe và suy nghĩ thấu đáo trước khi nói'], watch_outs: ['Dễ bị ngợp hoặc kiệt sức trong những môi trường quá ồn ào và đông đúc'], environments: ['Môi trường làm việc yên tĩnh, ít bị làm phiền và tôn trọng không gian cá nhân'] },
      ],
      BF_A: [
        { level: 'prominent', meaning: 'Mức độ Dễ chịu cao', evidence: 'Điểm số cao hơn trung bình nhiều ở nhóm Dễ chịu (Agreeableness).', insight: 'Bạn rất hòa đồng, vị tha và luôn cố gắng giữ gìn sự hòa hợp với mọi người xung quanh.', strengths: ['Dễ hợp tác và làm việc nhóm hiệu quả', 'Biết cách xoa dịu các xung đột'], watch_outs: ['Khó nói lời từ chối, dễ bị lợi dụng lòng tốt'], environments: ['Môi trường làm việc thân thiện, đề cao sự hòa hợp và ít tính cạnh tranh gay gắt'] },
        { level: 'moderate', meaning: 'Mức độ Dễ chịu trung bình', evidence: 'Điểm số ở mức trung bình ở nhóm Dễ chịu.', insight: 'Bạn biết cân bằng giữa lợi ích cá nhân và lợi ích tập thể.', strengths: ['Hòa đồng nhưng vẫn biết cách bảo vệ quyền lợi của bản thân khi cần thiết'], watch_outs: [], environments: [] },
        { level: 'lower', meaning: 'Mức độ Dễ chịu thấp', evidence: 'Điểm số thấp hơn trung bình nhiều ở nhóm Dễ chịu.', insight: 'Bạn thẳng thắn, có xu hướng hoài nghi và không ngại va chạm để bảo vệ quan điểm.', strengths: ['Sẵn sàng đối mặt với thách thức và bảo vệ ý kiến cá nhân', 'Rất phù hợp với vai trò phản biện'], watch_outs: ['Dễ gây mâu thuẫn hoặc tạo cảm giác xa cách với đồng nghiệp'], environments: ['Môi trường làm việc đề cao hiệu quả, tranh luận thẳng thắn và cạnh tranh công bằng'] },
      ],
      BF_N: [
        { level: 'prominent', meaning: 'Nhạy cảm với Căng thẳng cao', evidence: 'Điểm số cao hơn trung bình nhiều ở nhóm Nhạy cảm (Neuroticism).', insight: 'Bạn dễ nhạy cảm với các yếu tố gây căng thẳng, áp lực và thường xuyên phản ứng mạnh với cảm xúc tiêu cực.', strengths: ['Rất nhạy bén trong việc phát hiện các rủi ro tiềm ẩn'], watch_outs: ['Dễ bị lo âu, căng thẳng hoặc hoang mang trước áp lực công việc'], environments: ['Môi trường làm việc an toàn, ít biến động và có sự hỗ trợ tâm lý tốt'] },
        { level: 'moderate', meaning: 'Kiểm soát Căng thẳng trung bình', evidence: 'Điểm số ở mức trung bình ở nhóm Nhạy cảm.', insight: 'Bạn xử lý cảm xúc ở mức trung bình, có thể đối mặt với áp lực nhưng vẫn cần thời gian phục hồi.', strengths: ['Biết cách giữ thăng bằng trong các tình huống khó khăn vừa phải'], watch_outs: [], environments: [] },
        { level: 'lower', meaning: 'Điềm tĩnh và Ổn định cảm xúc', evidence: 'Điểm số thấp hơn trung bình nhiều ở nhóm Nhạy cảm.', insight: 'Bạn rất điềm tĩnh, lạc quan và hiếm khi bị ảnh hưởng bởi stress hay các biến cố bất ngờ.', strengths: ['Bình tĩnh giải quyết vấn đề dưới áp lực cao', 'Khả năng phục hồi cảm xúc xuất sắc'], watch_outs: [], environments: ['Môi trường làm việc có tính áp lực cao, đòi hỏi "thần kinh thép" và ra quyết định nhanh'] },
      ]
    }
  },
  work_values: {
    bands: PROVISIONAL_BANDS,
    dimensions: {
      WV_ACHIEVEMENT: [
        { level: 'high', meaning: 'Coi trọng Thành tựu', evidence: '', insight: 'Bạn khao khát được tạo ra kết quả xuất sắc và vượt qua các thử thách khó khăn.', strengths: ['Động lực tự thân cực kỳ mạnh mẽ'], watch_outs: [], environments: ['Môi trường đánh giá nhân sự dựa trên kết quả và thành tựu rõ ràng'] },
        { level: 'medium', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] },
        { level: 'low', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] }
      ],
      WV_INDEPENDENCE: [
        { level: 'high', meaning: 'Coi trọng Sự Tự chủ', evidence: '', insight: 'Bạn mong muốn có toàn quyền quyết định cách thức thực hiện công việc của mình.', strengths: ['Khả năng tư duy và làm việc hoàn toàn độc lập'], watch_outs: [], environments: ['Môi trường trao quyền, ít sự can thiệp từ quản lý vi mô (micro-management)'] },
        { level: 'medium', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] },
        { level: 'low', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] }
      ],
      WV_RECOGNITION: [
        { level: 'high', meaning: 'Coi trọng Sự Công nhận', evidence: '', insight: 'Bạn muốn những đóng góp của mình được nhìn nhận, khen thưởng và có cơ hội thăng tiến.', strengths: ['Luôn nỗ lực tiến lên phía trước để đạt được danh tiếng và địa vị'], watch_outs: [], environments: ['Môi trường có lộ trình thăng tiến rõ ràng và thường xuyên tôn vinh nhân viên'] },
        { level: 'medium', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] },
        { level: 'low', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] }
      ],
      WV_RELATIONSHIPS: [
        { level: 'high', meaning: 'Coi trọng Mối quan hệ', evidence: '', insight: 'Bạn xem trọng tình đồng nghiệp, sự gắn kết và tinh thần làm việc không cạnh tranh tiêu cực.', strengths: ['Dễ dàng xây dựng và duy trì sự hòa hợp trong tập thể'], watch_outs: [], environments: ['Văn hóa công ty thân thiện, coi trọng con người và tinh thần đồng đội'] },
        { level: 'medium', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] },
        { level: 'low', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] }
      ],
      WV_SUPPORT: [
        { level: 'high', meaning: 'Coi trọng Sự Hỗ trợ', evidence: '', insight: 'Bạn ưu tiên một công ty có ban lãnh đạo thấu hiểu, sẵn sàng đồng hành và đào tạo nhân viên.', strengths: ['Học hỏi nhanh và phát triển tốt khi được dẫn dắt đúng cách'], watch_outs: [], environments: ['Môi trường có các chương trình đào tạo, mentorship và sếp trực tiếp tận tâm'] },
        { level: 'medium', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] },
        { level: 'low', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] }
      ],
      WV_CONDITIONS: [
        { level: 'high', meaning: 'Coi trọng Điều kiện làm việc', evidence: '', insight: 'Bạn muốn một công việc mang lại sự an toàn, ổn định và các đãi ngộ, môi trường vật lý tốt.', strengths: ['Tạo ra sự ổn định và gắn bó lâu dài nếu được đáp ứng đúng nhu cầu'], watch_outs: [], environments: ['Các tổ chức lớn, ổn định, có chính sách phúc lợi và điều kiện làm việc tiêu chuẩn cao'] },
        { level: 'medium', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] },
        { level: 'low', meaning: '', evidence: '', insight: '', strengths: [], watch_outs: [], environments: [] }
      ]
    }
  }
};
