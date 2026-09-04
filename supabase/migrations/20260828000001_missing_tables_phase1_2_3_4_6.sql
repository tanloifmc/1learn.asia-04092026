-- Migration: Missing tables from Phases 1, 2, 3, 6
-- student_goals (Phase 1), career_skills + career_education_paths (Phase 3)
-- task_completions (Phase 6), assessment_dimension_scores (Phase 2), match_explanations (Phase 4)

-- ============================================================
-- PHASE 1: student_goals (was referenced in SRS but table missing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type IN ('career', 'university', 'skill', 'general')),
  goal_text text NOT NULL,
  target_year smallint,
  priority integer NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'abandoned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see own goals" ON public.student_goals
  FOR ALL USING (student_id = auth.uid());

-- ============================================================
-- PHASE 3: career_skills (normalized, referenced in roadmap)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.career_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  skill_category text NOT NULL DEFAULT 'technical' CHECK (skill_category IN ('technical', 'soft', 'domain', 'tool')),
  importance text NOT NULL DEFAULT 'required' CHECK (importance IN ('required', 'preferred', 'nice_to_have')),
  proficiency_level text NOT NULL DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_skill_unique UNIQUE(career_id, skill_name)
);

ALTER TABLE public.career_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read career_skills" ON public.career_skills FOR SELECT USING (true);
CREATE POLICY "Admin manage career_skills" ON public.career_skills FOR ALL USING (private.is_content_manager());

-- ============================================================
-- PHASE 3: career_education_paths
-- ============================================================
CREATE TABLE IF NOT EXISTS public.career_education_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  path_level text NOT NULL CHECK (path_level IN ('high_school', 'vocational', 'associate', 'bachelor', 'master', 'phd')),
  field_of_study text NOT NULL,
  is_preferred boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.career_education_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read career_education_paths" ON public.career_education_paths FOR SELECT USING (true);
CREATE POLICY "Admin manage career_education_paths" ON public.career_education_paths FOR ALL USING (private.is_content_manager());

-- ============================================================
-- PHASE 2: assessment_dimension_scores (per-session dimension detail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assessment_dimension_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid NOT NULL REFERENCES public.assessment_results(id) ON DELETE CASCADE,
  dimension_id uuid NOT NULL REFERENCES public.assessment_dimensions(id),
  dimension_code text NOT NULL,
  raw_score numeric NOT NULL,
  normalized_score numeric NOT NULL CHECK (normalized_score >= 0 AND normalized_score <= 1),
  questions_answered integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dim_score_unique UNIQUE(result_id, dimension_id)
);

ALTER TABLE public.assessment_dimension_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own dimension scores" ON public.assessment_dimension_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessment_results ar
      JOIN public.assessment_sessions sess ON ar.session_id = sess.id
      WHERE ar.id = assessment_dimension_scores.result_id
      AND sess.student_id = auth.uid()
    )
  );

-- ============================================================
-- PHASE 4: match_explanations (detailed explanation per match)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.match_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.career_matches(id) ON DELETE CASCADE,
  factor_type text NOT NULL CHECK (factor_type IN ('positive', 'negative', 'neutral')),
  dimension text NOT NULL,
  label text NOT NULL,
  student_value numeric,
  career_requirement numeric,
  magnitude numeric,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.match_explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own match explanations" ON public.match_explanations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.career_matches cm
      JOIN public.match_runs mr ON cm.run_id = mr.id
      WHERE cm.id = match_explanations.match_id
      AND mr.student_id = auth.uid()
    )
  );

-- ============================================================
-- PHASE 6: task_completions (detailed evidence per task)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.roadmap_tasks(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completion_type text NOT NULL DEFAULT 'self_reported' CHECK (completion_type IN ('self_reported', 'verified', 'auto_detected')),
  evidence_text text,
  evidence_url text,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own task completions" ON public.task_completions
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can insert own task completions" ON public.task_completions
  FOR INSERT WITH CHECK (student_id = auth.uid());
