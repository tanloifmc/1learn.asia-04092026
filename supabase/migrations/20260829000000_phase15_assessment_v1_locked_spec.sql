-- ============================================================
-- Phase 15: Assessment V1.0 — Locked Spec Seed
-- Replaces all old question data with the 121-item bank from LOCKED SPEC V1.0
-- DO NOT MODIFY this migration. To change questions, create a new version.
-- ============================================================

-- Step 1: Add metadata columns if they don't exist
ALTER TABLE public.assessment_dimensions ADD COLUMN IF NOT EXISTS framework text;
ALTER TABLE public.assessment_questions ADD COLUMN IF NOT EXISTS question_code text;
ALTER TABLE public.assessment_questions ADD COLUMN IF NOT EXISTS module text;
-- raw_min / raw_max / normalization formula stored per dimension for scoring engine
ALTER TABLE public.assessment_dimensions ADD COLUMN IF NOT EXISTS raw_min numeric;
ALTER TABLE public.assessment_dimensions ADD COLUMN IF NOT EXISTS raw_max numeric;
ALTER TABLE public.assessment_dimensions ADD COLUMN IF NOT EXISTS normalization_formula text;
ALTER TABLE public.assessment_dimensions ADD COLUMN IF NOT EXISTS matching_role text; -- 'primary', 'secondary', 'readiness', 'quality'

-- Step 2: Archive ALL existing assessment data to avoid stale data
UPDATE public.assessment_versions SET status = 'archived' WHERE status IN ('published', 'draft', 'internal_test', 'review');
-- Remove old sessions/responses so students start fresh with correct questions
-- (Only safe in pre-launch. In post-launch, we would keep old data and just add new version)
DELETE FROM public.derived_profile_signals;
DELETE FROM public.assessment_result_dimensions;
DELETE FROM public.assessment_results;
DELETE FROM public.assessment_responses;
DELETE FROM public.assessment_sessions;
DELETE FROM public.assessment_question_options;
DELETE FROM public.assessment_questions;
DELETE FROM public.assessment_dimensions;
-- Keep the assessment record, just update/insert new version below

-- Step 3: Ensure the master assessment record exists
INSERT INTO public.assessments (code, name, description)
VALUES ('1learn_career_exploration', '1learn Career Exploration Assessment', 'Bộ đánh giá định hướng nghề nghiệp và khám phá bản thân dành cho học sinh THPT.')
ON CONFLICT (code) DO NOTHING;

-- Step 4: Create Version 2026.1 (THE LOCKED SPEC)
DO $$
DECLARE
  v_assessment_id uuid;
  v_version_id uuid;
  -- Dimension IDs
  d_r uuid; d_i uuid; d_a uuid; d_s uuid; d_e uuid; d_c uuid;  -- RIASEC
  d_o uuid; d_cbf uuid; d_ex uuid; d_ag uuid; d_em uuid;       -- Big Five
  d_wv_achieve uuid; d_wv_indep uuid; d_wv_recog uuid;
  d_wv_rel uuid; d_wv_sup uuid; d_wv_cond uuid;               -- Work Values
  d_cr uuid;                                                    -- Career Readiness
  d_vq uuid;                                                    -- Validity/Quality (no scoring role)
BEGIN
  SELECT id INTO v_assessment_id FROM public.assessments WHERE code = '1learn_career_exploration';

  INSERT INTO public.assessment_versions (assessment_id, version_tag, status, scoring_rules_version)
  VALUES (v_assessment_id, '2026.1', 'published', '1.0')
  RETURNING id INTO v_version_id;

  -- ====================================================================
  -- DIMENSIONS
  -- ====================================================================
  -- RIASEC (primary matching signal, weight 0.60 in matching)
  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'R', 'Thực hành (Realistic)', 'Sở thích với hoạt động thực tế, máy móc, công cụ', 'riasec', 6, 30, '((raw - 6) / 24) * 100', 'primary')
  RETURNING id INTO d_r;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'I', 'Phân tích (Investigative)', 'Sở thích với nghiên cứu, phân tích, khám phá kiến thức', 'riasec', 6, 30, '((raw - 6) / 24) * 100', 'primary')
  RETURNING id INTO d_i;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'A', 'Sáng tạo (Artistic)', 'Sở thích với sáng tạo, thiết kế, nghệ thuật', 'riasec', 6, 30, '((raw - 6) / 24) * 100', 'primary')
  RETURNING id INTO d_a;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'S', 'Xã hội (Social)', 'Sở thích với việc giúp đỡ, dạy học, hỗ trợ con người', 'riasec', 6, 30, '((raw - 6) / 24) * 100', 'primary')
  RETURNING id INTO d_s;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'E', 'Lãnh đạo (Enterprising)', 'Sở thích với kinh doanh, lãnh đạo, thuyết phục', 'riasec', 6, 30, '((raw - 6) / 24) * 100', 'primary')
  RETURNING id INTO d_e;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'C', 'Tổ chức (Conventional)', 'Sở thích với hệ thống, dữ liệu, quy trình', 'riasec', 6, 30, '((raw - 6) / 24) * 100', 'primary')
  RETURNING id INTO d_c;

  -- Big Five (secondary signal, weight 0.15 in matching — context only, NOT a gate)
  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'BF_O', 'Cởi mở (Openness)', 'Mức độ tò mò, sáng tạo, cởi mở với trải nghiệm mới', 'big_five', 6, 30, '((raw - 6) / 24) * 100', 'secondary')
  RETURNING id INTO d_o;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'BF_C', 'Tận tâm (Conscientiousness)', 'Mức độ trách nhiệm, kỷ luật, có tổ chức', 'big_five', 6, 30, '((raw - 6) / 24) * 100', 'secondary')
  RETURNING id INTO d_cbf;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'BF_E', 'Hướng ngoại (Extraversion)', 'Mức độ giao tiếp xã hội và hướng ngoại', 'big_five', 6, 30, '((raw - 6) / 24) * 100', 'secondary')
  RETURNING id INTO d_ex;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'BF_A', 'Dễ chịu (Agreeableness)', 'Mức độ hợp tác, đồng cảm, tin tưởng', 'big_five', 6, 30, '((raw - 6) / 24) * 100', 'secondary')
  RETURNING id INTO d_ag;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'BF_N', 'Ổn định cảm xúc (Emotional Stability)', 'Mức độ phản ứng cảm xúc với stress và áp lực', 'big_five', 6, 30, '((raw - 6) / 24) * 100', 'secondary')
  RETURNING id INTO d_em;

  -- Work Values (secondary matching signal, weight 0.25 in matching)
  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'WV_ACHIEVEMENT', 'Thành tựu', 'Coi trọng kết quả, phát triển năng lực, mục tiêu rõ ràng', 'work_values', 5, 25, '((raw - 5) / 20) * 100', 'secondary')
  RETURNING id INTO d_wv_achieve;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'WV_INDEPENDENCE', 'Tự chủ', 'Coi trọng quyền chủ động, không gian sáng tạo', 'work_values', 5, 25, '((raw - 5) / 20) * 100', 'secondary')
  RETURNING id INTO d_wv_indep;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'WV_RECOGNITION', 'Ghi nhận', 'Coi trọng sự công nhận, tiến bộ nghề nghiệp', 'work_values', 5, 25, '((raw - 5) / 20) * 100', 'secondary')
  RETURNING id INTO d_wv_recog;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'WV_RELATIONSHIPS', 'Quan hệ', 'Coi trọng con người, hợp tác, đóng góp xã hội', 'work_values', 5, 25, '((raw - 5) / 20) * 100', 'secondary')
  RETURNING id INTO d_wv_rel;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'WV_SUPPORT', 'Hỗ trợ', 'Coi trọng môi trường hỗ trợ, hướng dẫn từ tổ chức', 'work_values', 5, 25, '((raw - 5) / 20) * 100', 'secondary')
  RETURNING id INTO d_wv_sup;

  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'WV_CONDITIONS', 'Điều kiện làm việc', 'Coi trọng ổn định, thu nhập, cân bằng cuộc sống', 'work_values', 5, 25, '((raw - 5) / 20) * 100', 'secondary')
  RETURNING id INTO d_wv_cond;

  -- Career Readiness (readiness signal — NOT used for career matching)
  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'CR', 'Sẵn sàng Khám phá', 'Mức độ học sinh đã bắt đầu khám phá, đặt mục tiêu, lên kế hoạch', 'career_readiness', 15, 75, '((raw - 15) / 60) * 100', 'readiness')
  RETURNING id INTO d_cr;

  -- Validity/Quality (quality control — no scoring dimension)
  INSERT INTO public.assessment_dimensions (version_id, code, name, description, framework, raw_min, raw_max, normalization_formula, matching_role)
  VALUES (v_version_id, 'VQ', 'Kiểm soát Chất lượng', 'Câu hỏi kiểm tra tính chú ý và nhất quán của câu trả lời', 'validity', NULL, NULL, NULL, 'quality')
  RETURNING id INTO d_vq;

  -- ====================================================================
  -- QUESTIONS — MODULE A: RIASEC (36 questions, 6 per dimension)
  -- Scale: 1-5, No reverse scoring
  -- ====================================================================
  -- R — REALISTIC
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_r, 'R01', 'riasec', 1, 'Tôi thích tự tay lắp ráp, sửa chữa hoặc tạo ra một vật thể.', false, 1.0),
  (v_version_id, d_r, 'R02', 'riasec', 2, 'Tôi thích những hoạt động có kết quả cụ thể mà tôi có thể nhìn thấy hoặc kiểm tra được.', false, 1.0),
  (v_version_id, d_r, 'R03', 'riasec', 3, 'Tôi hứng thú với máy móc, thiết bị hoặc công nghệ phần cứng.', false, 1.0),
  (v_version_id, d_r, 'R04', 'riasec', 4, 'Tôi thích học thông qua việc thực hành hơn là chỉ đọc lý thuyết.', false, 1.0),
  (v_version_id, d_r, 'R05', 'riasec', 5, 'Tôi cảm thấy thoải mái khi làm việc với công cụ, thiết bị hoặc vật liệu.', false, 1.0),
  (v_version_id, d_r, 'R06', 'riasec', 6, 'Tôi thích tìm cách vận hành hoặc cải thiện một hệ thống thực tế.', false, 1.0);

  -- I — INVESTIGATIVE
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_i, 'I01', 'riasec', 7, 'Tôi thích tìm hiểu nguyên nhân đằng sau một hiện tượng.', false, 1.0),
  (v_version_id, d_i, 'I02', 'riasec', 8, 'Tôi thích giải những vấn đề không có câu trả lời ngay lập tức.', false, 1.0),
  (v_version_id, d_i, 'I03', 'riasec', 9, 'Tôi thường muốn biết "vì sao" trước khi chấp nhận một kết luận.', false, 1.0),
  (v_version_id, d_i, 'I04', 'riasec', 10, 'Tôi thích phân tích dữ liệu để tìm ra quy luật.', false, 1.0),
  (v_version_id, d_i, 'I05', 'riasec', 11, 'Tôi hứng thú với khoa học, nghiên cứu hoặc khám phá kiến thức mới.', false, 1.0),
  (v_version_id, d_i, 'I06', 'riasec', 12, 'Tôi thích những nhiệm vụ đòi hỏi suy luận và tư duy logic.', false, 1.0);

  -- A — ARTISTIC
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_a, 'A01', 'riasec', 13, 'Tôi thích tạo ra những ý tưởng hoặc sản phẩm mang dấu ấn cá nhân.', false, 1.0),
  (v_version_id, d_a, 'A02', 'riasec', 14, 'Tôi hứng thú với thiết kế, hình ảnh, âm nhạc, viết lách hoặc các hình thức sáng tạo.', false, 1.0),
  (v_version_id, d_a, 'A03', 'riasec', 15, 'Tôi thường nghĩ ra nhiều cách khác nhau để thể hiện một ý tưởng.', false, 1.0),
  (v_version_id, d_a, 'A04', 'riasec', 16, 'Tôi thích những công việc cho phép tôi tự do thử nghiệm.', false, 1.0),
  (v_version_id, d_a, 'A05', 'riasec', 17, 'Tôi quan tâm đến vẻ đẹp, cách trình bày và trải nghiệm của người khác.', false, 1.0),
  (v_version_id, d_a, 'A06', 'riasec', 18, 'Tôi cảm thấy hứng thú khi biến một ý tưởng trừu tượng thành sản phẩm cụ thể.', false, 1.0);

  -- S — SOCIAL
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_s, 'S01', 'riasec', 19, 'Tôi thích giúp người khác hiểu một vấn đề khó.', false, 1.0),
  (v_version_id, d_s, 'S02', 'riasec', 20, 'Tôi cảm thấy có ý nghĩa khi hỗ trợ người khác tiến bộ.', false, 1.0),
  (v_version_id, d_s, 'S03', 'riasec', 21, 'Tôi thích làm việc cùng người khác hơn là luôn làm việc một mình.', false, 1.0),
  (v_version_id, d_s, 'S04', 'riasec', 22, 'Tôi quan tâm đến cảm xúc và nhu cầu của người khác.', false, 1.0),
  (v_version_id, d_s, 'S05', 'riasec', 23, 'Tôi thích hướng dẫn, dạy học hoặc chia sẻ kiến thức.', false, 1.0),
  (v_version_id, d_s, 'S06', 'riasec', 24, 'Tôi muốn công việc của mình tạo ra tác động tích cực đối với con người.', false, 1.0);

  -- E — ENTERPRISING
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_e, 'E01', 'riasec', 25, 'Tôi thích thuyết phục người khác ủng hộ một ý tưởng.', false, 1.0),
  (v_version_id, d_e, 'E02', 'riasec', 26, 'Tôi thích đứng ra tổ chức hoặc dẫn dắt một nhóm.', false, 1.0),
  (v_version_id, d_e, 'E03', 'riasec', 27, 'Tôi hứng thú với kinh doanh, khởi nghiệp hoặc phát triển dự án.', false, 1.0),
  (v_version_id, d_e, 'E04', 'riasec', 28, 'Tôi thích đặt mục tiêu và tìm cách đạt được chúng.', false, 1.0),
  (v_version_id, d_e, 'E05', 'riasec', 29, 'Tôi cảm thấy hứng thú với những tình huống cần ra quyết định.', false, 1.0),
  (v_version_id, d_e, 'E06', 'riasec', 30, 'Tôi thích trình bày ý tưởng trước người khác.', false, 1.0);

  -- C — CONVENTIONAL
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_c, 'C01', 'riasec', 31, 'Tôi thích sắp xếp thông tin theo một hệ thống rõ ràng.', false, 1.0),
  (v_version_id, d_c, 'C02', 'riasec', 32, 'Tôi thích làm việc với bảng biểu, dữ liệu hoặc hồ sơ.', false, 1.0),
  (v_version_id, d_c, 'C03', 'riasec', 33, 'Tôi chú ý đến việc làm đúng quy trình.', false, 1.0),
  (v_version_id, d_c, 'C04', 'riasec', 34, 'Tôi thích những nhiệm vụ có cấu trúc và yêu cầu rõ ràng.', false, 1.0),
  (v_version_id, d_c, 'C05', 'riasec', 35, 'Tôi thường kiểm tra lại công việc để tránh sai sót.', false, 1.0),
  (v_version_id, d_c, 'C06', 'riasec', 36, 'Tôi thích lập kế hoạch và tổ chức công việc theo thứ tự.', false, 1.0);

  -- ====================================================================
  -- MODULE B: BIG FIVE (30 questions, 6 per dimension)
  -- Scale: 1-5. No reverse scoring in V1.
  -- Scoring: ((mean - 1) / 4) * 100  →  use raw_min=6, raw_max=30 → ((raw-6)/24)*100 for SUM
  -- ====================================================================
  -- O — OPENNESS
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_o, 'O01', 'big_five', 37, 'Tôi thích khám phá những ý tưởng mới.', false, 1.0),
  (v_version_id, d_o, 'O02', 'big_five', 38, 'Tôi thường tò mò về những điều mình chưa biết.', false, 1.0),
  (v_version_id, d_o, 'O03', 'big_five', 39, 'Tôi thích thử những cách tiếp cận khác với cách quen thuộc.', false, 1.0),
  (v_version_id, d_o, 'O04', 'big_five', 40, 'Tôi dễ bị thu hút bởi những chủ đề mới lạ.', false, 1.0),
  (v_version_id, d_o, 'O05', 'big_five', 41, 'Tôi thích tưởng tượng những khả năng khác nhau cho tương lai.', false, 1.0),
  (v_version_id, d_o, 'O06', 'big_five', 42, 'Tôi thích học những lĩnh vực nằm ngoài những gì mình đã quen thuộc.', false, 1.0);

  -- C — CONSCIENTIOUSNESS (prefix BC to avoid ID conflict)
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_cbf, 'BC01', 'big_five', 43, 'Tôi thường hoàn thành việc mình đã cam kết.', false, 1.0),
  (v_version_id, d_cbf, 'BC02', 'big_five', 44, 'Tôi thích lập kế hoạch trước khi bắt đầu một nhiệm vụ.', false, 1.0),
  (v_version_id, d_cbf, 'BC03', 'big_five', 45, 'Tôi thường kiểm tra lại công việc trước khi nộp.', false, 1.0),
  (v_version_id, d_cbf, 'BC04', 'big_five', 46, 'Tôi có thể duy trì nỗ lực ngay cả khi nhiệm vụ trở nên nhàm chán.', false, 1.0),
  (v_version_id, d_cbf, 'BC05', 'big_five', 47, 'Tôi thường sắp xếp thời gian để hoàn thành mục tiêu.', false, 1.0),
  (v_version_id, d_cbf, 'BC06', 'big_five', 48, 'Tôi cố gắng làm việc một cách có trách nhiệm.', false, 1.0);

  -- E — EXTRAVERSION (prefix BF_E to distinguish from RIASEC E)
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_ex, 'BF_E01', 'big_five', 49, 'Tôi cảm thấy có năng lượng khi được giao tiếp với nhiều người.', false, 1.0),
  (v_version_id, d_ex, 'BF_E02', 'big_five', 50, 'Tôi thường chủ động bắt chuyện với người mới.', false, 1.0),
  (v_version_id, d_ex, 'BF_E03', 'big_five', 51, 'Tôi thích tham gia các hoạt động nhóm.', false, 1.0),
  (v_version_id, d_ex, 'BF_E04', 'big_five', 52, 'Tôi cảm thấy khá thoải mái khi nói trước nhiều người.', false, 1.0),
  (v_version_id, d_ex, 'BF_E05', 'big_five', 53, 'Tôi thường chủ động thể hiện ý kiến của mình.', false, 1.0),
  (v_version_id, d_ex, 'BF_E06', 'big_five', 54, 'Tôi thích những môi trường có nhiều tương tác xã hội.', false, 1.0);

  -- A — AGREEABLENESS (prefix BF_A)
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_ag, 'BF_A01', 'big_five', 55, 'Tôi cố gắng hiểu quan điểm của người khác trước khi đánh giá họ.', false, 1.0),
  (v_version_id, d_ag, 'BF_A02', 'big_five', 56, 'Tôi sẵn sàng hỗ trợ người khác khi họ gặp khó khăn.', false, 1.0),
  (v_version_id, d_ag, 'BF_A03', 'big_five', 57, 'Tôi coi trọng sự hợp tác trong nhóm.', false, 1.0),
  (v_version_id, d_ag, 'BF_A04', 'big_five', 58, 'Tôi thường cân nhắc cảm xúc của người khác khi đưa ra quyết định.', false, 1.0),
  (v_version_id, d_ag, 'BF_A05', 'big_five', 59, 'Tôi thích giải quyết bất đồng bằng cách tìm điểm chung.', false, 1.0),
  (v_version_id, d_ag, 'BF_A06', 'big_five', 60, 'Tôi muốn mình là người đáng tin cậy đối với những người xung quanh.', false, 1.0);

  -- N — EMOTIONAL REACTIVITY
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_em, 'N01', 'big_five', 61, 'Tôi dễ lo lắng khi có một vấn đề quan trọng xảy ra.', false, 1.0),
  (v_version_id, d_em, 'N02', 'big_five', 62, 'Tôi thường suy nghĩ nhiều về những điều có thể xảy ra.', false, 1.0),
  (v_version_id, d_em, 'N03', 'big_five', 63, 'Tôi dễ cảm thấy căng thẳng khi phải đối mặt với áp lực.', false, 1.0),
  (v_version_id, d_em, 'N04', 'big_five', 64, 'Tôi có thể mất khá nhiều thời gian để bình tĩnh sau một thất bại.', false, 1.0),
  (v_version_id, d_em, 'N05', 'big_five', 65, 'Tôi thường nhạy cảm với những đánh giá tiêu cực.', false, 1.0),
  (v_version_id, d_em, 'N06', 'big_five', 66, 'Tôi dễ bị ảnh hưởng cảm xúc khi kế hoạch của mình không diễn ra như mong đợi.', false, 1.0);

  -- ====================================================================
  -- MODULE C: WORK VALUES (30 questions, 5 per dimension)
  -- Scale: 1-5 ("Điều này quan trọng với tôi...")
  -- raw_min=5, raw_max=25: ((raw-5)/20)*100
  -- ====================================================================
  -- WV_ACHIEVEMENT
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_wv_achieve, 'WV01', 'work_values', 67, 'Tôi muốn công việc cho phép tôi sử dụng tốt năng lực của mình.', false, 1.0),
  (v_version_id, d_wv_achieve, 'WV02', 'work_values', 68, 'Tôi muốn nhìn thấy kết quả cụ thể từ những gì mình làm.', false, 1.0),
  (v_version_id, d_wv_achieve, 'WV03', 'work_values', 69, 'Tôi muốn công việc giúp tôi liên tục phát triển năng lực.', false, 1.0),
  (v_version_id, d_wv_achieve, 'WV04', 'work_values', 70, 'Tôi muốn có những mục tiêu rõ ràng để phấn đấu.', false, 1.0),
  (v_version_id, d_wv_achieve, 'WV05', 'work_values', 71, 'Tôi muốn cảm thấy mình đang tạo ra thành quả có ý nghĩa.', false, 1.0);

  -- WV_INDEPENDENCE
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_wv_indep, 'WV06', 'work_values', 72, 'Tôi muốn có quyền chủ động trong cách thực hiện công việc.', false, 1.0),
  (v_version_id, d_wv_indep, 'WV07', 'work_values', 73, 'Tôi muốn có cơ hội tự đưa ra quyết định.', false, 1.0),
  (v_version_id, d_wv_indep, 'WV08', 'work_values', 74, 'Tôi thích môi trường khuyến khích sáng tạo và thử nghiệm.', false, 1.0),
  (v_version_id, d_wv_indep, 'WV09', 'work_values', 75, 'Tôi muốn có không gian để phát triển ý tưởng của riêng mình.', false, 1.0),
  (v_version_id, d_wv_indep, 'WV10', 'work_values', 76, 'Tôi không muốn công việc kiểm soát quá chặt cách tôi làm việc.', false, 1.0);

  -- WV_RECOGNITION
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_wv_recog, 'WV11', 'work_values', 77, 'Tôi muốn những đóng góp của mình được ghi nhận.', false, 1.0),
  (v_version_id, d_wv_recog, 'WV12', 'work_values', 78, 'Tôi muốn có cơ hội tiến bộ trong nghề nghiệp.', false, 1.0),
  (v_version_id, d_wv_recog, 'WV13', 'work_values', 79, 'Tôi muốn thành tích của mình được đánh giá công bằng.', false, 1.0),
  (v_version_id, d_wv_recog, 'WV14', 'work_values', 80, 'Tôi muốn có cơ hội đảm nhận vai trò có trách nhiệm cao hơn.', false, 1.0),
  (v_version_id, d_wv_recog, 'WV15', 'work_values', 81, 'Tôi coi trọng việc đạt được vị trí nghề nghiệp mà mình tự hào.', false, 1.0);

  -- WV_RELATIONSHIPS
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_wv_rel, 'WV16', 'work_values', 82, 'Tôi muốn làm việc với những người mà mình có thể tin tưởng.', false, 1.0),
  (v_version_id, d_wv_rel, 'WV17', 'work_values', 83, 'Tôi muốn công việc tạo cơ hội giúp đỡ người khác.', false, 1.0),
  (v_version_id, d_wv_rel, 'WV18', 'work_values', 84, 'Tôi muốn cảm thấy mình thuộc về một tập thể.', false, 1.0),
  (v_version_id, d_wv_rel, 'WV19', 'work_values', 85, 'Tôi coi trọng sự hợp tác giữa đồng nghiệp.', false, 1.0),
  (v_version_id, d_wv_rel, 'WV20', 'work_values', 86, 'Tôi muốn công việc của mình có ích cho cộng đồng hoặc xã hội.', false, 1.0);

  -- WV_SUPPORT
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_wv_sup, 'WV21', 'work_values', 87, 'Tôi muốn được hướng dẫn khi gặp vấn đề khó.', false, 1.0),
  (v_version_id, d_wv_sup, 'WV22', 'work_values', 88, 'Tôi coi trọng một môi trường làm việc tôn trọng nhân viên.', false, 1.0),
  (v_version_id, d_wv_sup, 'WV23', 'work_values', 89, 'Tôi muốn nhận được phản hồi để biết mình đang làm tốt đến đâu.', false, 1.0),
  (v_version_id, d_wv_sup, 'WV24', 'work_values', 90, 'Tôi muốn làm việc trong một tổ chức có chính sách rõ ràng.', false, 1.0),
  (v_version_id, d_wv_sup, 'WV25', 'work_values', 91, 'Tôi coi trọng sự hỗ trợ từ người quản lý và đồng nghiệp.', false, 1.0);

  -- WV_CONDITIONS
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_wv_cond, 'WV26', 'work_values', 92, 'Tôi coi trọng sự ổn định trong công việc.', false, 1.0),
  (v_version_id, d_wv_cond, 'WV27', 'work_values', 93, 'Tôi muốn công việc có điều kiện làm việc phù hợp với mình.', false, 1.0),
  (v_version_id, d_wv_cond, 'WV28', 'work_values', 94, 'Tôi muốn công việc có mức thu nhập phù hợp với mục tiêu của mình.', false, 1.0),
  (v_version_id, d_wv_cond, 'WV29', 'work_values', 95, 'Tôi thích công việc có sự đa dạng thay vì lặp lại hoàn toàn.', false, 1.0),
  (v_version_id, d_wv_cond, 'WV30', 'work_values', 96, 'Tôi muốn có sự cân bằng hợp lý giữa công việc và cuộc sống.', false, 1.0);

  -- ====================================================================
  -- MODULE D: CAREER READINESS (15 questions)
  -- Scale: 1-5. raw_min=15, raw_max=75: ((raw-15)/60)*100
  -- NOT used for career matching. Produces "Exploration Stage".
  -- ====================================================================
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  (v_version_id, d_cr, 'CR01', 'career_readiness', 97,  'Tôi đã bắt đầu tìm hiểu về những nghề nghiệp mà mình quan tâm.', false, 1.0),
  (v_version_id, d_cr, 'CR02', 'career_readiness', 98,  'Tôi biết ít nhất một số ngành học có thể dẫn đến nghề nghiệp mình quan tâm.', false, 1.0),
  (v_version_id, d_cr, 'CR03', 'career_readiness', 99,  'Tôi biết một số trường đại học có chương trình liên quan đến hướng mình đang tìm hiểu.', false, 1.0),
  (v_version_id, d_cr, 'CR04', 'career_readiness', 100, 'Tôi đã từng tìm hiểu yêu cầu tuyển sinh của một ngành hoặc trường mình quan tâm.', false, 1.0),
  (v_version_id, d_cr, 'CR05', 'career_readiness', 101, 'Tôi biết những môn học mình cần chú ý để chuẩn bị cho mục tiêu tương lai.', false, 1.0),
  (v_version_id, d_cr, 'CR06', 'career_readiness', 102, 'Tôi có một hoặc vài mục tiêu học tập cụ thể.', false, 1.0),
  (v_version_id, d_cr, 'CR07', 'career_readiness', 103, 'Tôi biết một số kỹ năng mình cần phát triển.', false, 1.0),
  (v_version_id, d_cr, 'CR08', 'career_readiness', 104, 'Tôi đã từng tham gia hoạt động giúp mình khám phá sở thích hoặc năng lực.', false, 1.0),
  (v_version_id, d_cr, 'CR09', 'career_readiness', 105, 'Tôi thường chủ động tìm thông tin thay vì chỉ chờ người khác hướng dẫn.', false, 1.0),
  (v_version_id, d_cr, 'CR10', 'career_readiness', 106, 'Tôi có thể giải thích tại sao mình quan tâm đến một nghề hoặc ngành học.', false, 1.0),
  (v_version_id, d_cr, 'CR11', 'career_readiness', 107, 'Tôi biết mình còn thiếu gì để tiến gần mục tiêu.', false, 1.0),
  (v_version_id, d_cr, 'CR12', 'career_readiness', 108, 'Tôi có kế hoạch cho những việc mình muốn thực hiện trong thời gian tới.', false, 1.0),
  (v_version_id, d_cr, 'CR13', 'career_readiness', 109, 'Tôi theo dõi tiến độ của những mục tiêu mình đã đặt ra.', false, 1.0),
  (v_version_id, d_cr, 'CR14', 'career_readiness', 110, 'Khi phát hiện kế hoạch không phù hợp, tôi sẵn sàng điều chỉnh.', false, 1.0),
  (v_version_id, d_cr, 'CR15', 'career_readiness', 111, 'Tôi cảm thấy mình đang chủ động khám phá tương lai của mình.', false, 1.0);

  -- ====================================================================
  -- MODULE E: VALIDITY / QUALITY CHECKS (10 questions)
  -- These are MIXED into the full assessment. They are NOT shown as a separate module.
  -- VQ_A01-VQ_A03: Attention checks (expected answer: 4)
  -- VQ_S01-VQ_S07: Straight-line detection markers (scored for consistency)
  -- ====================================================================
  INSERT INTO public.assessment_questions (version_id, dimension_id, question_code, module, order_index, question_text, is_reverse_scored, weight) VALUES
  -- Attention checks — embedded at positions 20, 50, 85 in final shuffled order
  (v_version_id, d_vq, 'VQ_A01', 'validity', 112, '[ATTENTION CHECK] Để xác nhận bạn đang đọc kỹ câu hỏi, vui lòng chọn "Khá đúng" (4).', false, 0.0),
  (v_version_id, d_vq, 'VQ_A02', 'validity', 113, '[ATTENTION CHECK] Câu hỏi này yêu cầu bạn chọn "Hoàn toàn không đúng với tôi" (1). Hãy chọn 1 để tiếp tục.', false, 0.0),
  (v_version_id, d_vq, 'VQ_A03', 'validity', 114, '[ATTENTION CHECK] Để xác nhận bạn đang tập trung, hãy chọn "Rất đúng với tôi" (5).', false, 0.0),
  -- Consistency / straight-line detection markers (repeated similar items)
  (v_version_id, d_vq, 'VQ_C01', 'validity', 115, 'Tôi thích tìm hiểu và học hỏi những điều mới.', false, 0.0),
  (v_version_id, d_vq, 'VQ_C02', 'validity', 116, 'Tôi thấy bản thân mình thường thích làm việc theo kế hoạch.', false, 0.0),
  (v_version_id, d_vq, 'VQ_C03', 'validity', 117, 'Tôi cảm thấy hài lòng khi hoàn thành một việc mình đã cam kết.', false, 0.0),
  (v_version_id, d_vq, 'VQ_C04', 'validity', 118, 'Tôi thoải mái khi nói chuyện với người mà tôi mới gặp.', false, 0.0),
  (v_version_id, d_vq, 'VQ_C05', 'validity', 119, 'Tôi nghĩ việc giúp đỡ người khác là điều có ý nghĩa.', false, 0.0),
  (v_version_id, d_vq, 'VQ_C06', 'validity', 120, 'Tôi muốn công việc của mình tạo ra giá trị thực sự.', false, 0.0),
  (v_version_id, d_vq, 'VQ_C07', 'validity', 121, 'Tôi thích môi trường làm việc ổn định và rõ ràng.', false, 0.0);

  RAISE NOTICE 'Assessment V2026.1 seeded with 121 questions across 16 dimensions. Version ID: %', v_version_id;
END $$;

-- ====================================================================
-- Add options for the standard 5-point Likert scale
-- These options apply to ALL questions in riasec, big_five, career_readiness,
-- and work_values modules. Validity module questions also use same scale.
-- ====================================================================
DO $$
DECLARE
  q RECORD;
BEGIN
  FOR q IN
    SELECT aq.id 
    FROM public.assessment_questions aq
    JOIN public.assessment_versions av ON av.id = aq.version_id
    WHERE av.version_tag = '2026.1'
  LOOP
    -- Determine label based on module
    -- For work_values: scale is about "importance"
    -- For others: scale is about "agreement with self-description"
    -- We use the same numeric values (1-5) but backend uses module-aware labeling
    INSERT INTO public.assessment_question_options (question_id, option_text, option_value, order_index) VALUES
    (q.id, '1', 1, 1),
    (q.id, '2', 2, 2),
    (q.id, '3', 3, 3),
    (q.id, '4', 4, 4),
    (q.id, '5', 5, 5);
  END LOOP;
END $$;
