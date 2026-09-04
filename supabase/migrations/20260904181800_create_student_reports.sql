-- Create student_reports table
CREATE TABLE student_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  assessment_result_id UUID NOT NULL REFERENCES assessment_results(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'free', -- 'free' or 'premium'
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing
CREATE INDEX idx_student_reports_student_id ON student_reports(student_id);
CREATE INDEX idx_student_reports_result_id ON student_reports(assessment_result_id);

-- RLS
ALTER TABLE student_reports ENABLE ROW LEVEL SECURITY;

-- Students can read their own reports
CREATE POLICY "Students can view own reports" 
  ON student_reports FOR SELECT 
  USING (auth.uid() = student_id);

-- Admins can read all reports
CREATE POLICY "Admins can view all reports" 
  ON student_reports FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles ?| array['admin', 'super_admin']
    )
  );

-- System can insert/update (Server role bypasses RLS anyway, but safe to allow insert by own user if doing it client side. However, we'll do it via server action, so server role has access).
-- Let's also grant explicit insert to authenticated users for their own id, just in case.
CREATE POLICY "Students can insert own reports" 
  ON student_reports FOR INSERT 
  WITH CHECK (auth.uid() = student_id);
