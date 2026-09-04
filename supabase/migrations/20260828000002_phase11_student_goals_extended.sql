-- Phase 11: Mở rộng student_goals để lưu structured goal (career, major, university)
-- Thêm constraint: chỉ 1 primary active goal / student

-- 1. Mở rộng bảng
ALTER TABLE public.student_goals
  ADD COLUMN IF NOT EXISTS career_id UUID REFERENCES public.careers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS readiness_score NUMERIC CHECK (readiness_score >= 0 AND readiness_score <= 100);

COMMENT ON COLUMN public.student_goals.career_id IS 'Nghề nghiệp mục tiêu (FK)';
COMMENT ON COLUMN public.student_goals.major_id IS 'Ngành học mục tiêu (FK)';
COMMENT ON COLUMN public.student_goals.university_id IS 'Trường đại học mục tiêu (FK)';
COMMENT ON COLUMN public.student_goals.is_primary IS 'Mục tiêu chính — tối đa 1 bản active/student (enforced by partial unique index)';
COMMENT ON COLUMN public.student_goals.readiness_score IS 'Cache: weighted readiness = Σ(weight_i × met_i) / Σ(weight_i) × 100. NULL = chưa đủ dữ liệu từ academic_records.';

-- 2. Partial unique index: mỗi student chỉ được có 1 primary+active goal
CREATE UNIQUE INDEX IF NOT EXISTS student_goals_one_primary_per_student
  ON public.student_goals (student_id)
  WHERE is_primary = true AND status = 'active';

-- 3. RLS: học sinh chỉ xem/sửa goal của chính mình
-- (policies đã được cấu hình trong phase1 — không cần thêm mới)

-- Verify migration
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'student_goals' AND column_name = 'career_id'
  ), 'Migration failed: career_id column not found';

  ASSERT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'student_goals'
    AND indexname = 'student_goals_one_primary_per_student'
  ), 'Migration failed: unique index not created';

  RAISE NOTICE 'Phase 11 migration: student_goals extended OK';
END $$;
