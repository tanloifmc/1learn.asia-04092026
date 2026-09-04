-- Fix missing RLS policy for assessment_question_options for students
CREATE POLICY "Student reads question options via session" ON public.assessment_question_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessment_questions q
            JOIN public.assessment_sessions s ON s.version_id = q.version_id
            JOIN public.assessment_versions v ON v.id = s.version_id
            WHERE q.id = assessment_question_options.question_id
              AND s.student_id = auth.uid()
              AND s.status = 'in_progress'
              AND v.status IN ('published', 'internal_test')
        )
    );
