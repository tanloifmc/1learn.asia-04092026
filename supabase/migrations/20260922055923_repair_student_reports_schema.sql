-- Repair environments that have the report feature code but did not receive
-- the original student_reports migration.
CREATE TABLE IF NOT EXISTS public.student_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  assessment_result_id UUID NOT NULL REFERENCES public.assessment_results(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'free' CHECK (report_type IN ('free', 'premium')),
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_reports_student_id
  ON public.student_reports (student_id);
CREATE INDEX IF NOT EXISTS idx_student_reports_result_id
  ON public.student_reports (assessment_result_id);

ALTER TABLE public.student_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'student_reports'
      AND policyname = 'Students can view own reports'
  ) THEN
    CREATE POLICY "Students can view own reports"
      ON public.student_reports FOR SELECT
      USING (auth.uid() = student_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'student_reports'
      AND policyname = 'Admins can view all reports'
  ) THEN
    CREATE POLICY "Admins can view all reports"
      ON public.student_reports FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;
