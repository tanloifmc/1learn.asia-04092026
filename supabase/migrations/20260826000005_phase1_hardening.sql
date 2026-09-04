-- Migration: Phase 1 Hardening & Data Integrity
-- Focus: Academic Records Temporal Tracking, Interest Data Source, Parent-Child Links, and RLS tightening

-- 1. Backup existing data before destructive operations
CREATE TABLE IF NOT EXISTS backup_academic_records AS SELECT * FROM public.academic_records;
CREATE TABLE IF NOT EXISTS backup_student_interests AS SELECT * FROM public.student_interests;

-- 2. Refactor academic_records
-- We need to add columns first, migrate data, then apply constraints
ALTER TABLE public.academic_records 
  ADD COLUMN IF NOT EXISTS academic_year text,
  ADD COLUMN IF NOT EXISTS grade_level smallint CHECK (grade_level IN (9, 10, 11, 12)),
  ADD COLUMN IF NOT EXISTS subject_code text,
  ADD COLUMN IF NOT EXISTS score numeric,
  ADD COLUMN IF NOT EXISTS max_score numeric,
  ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('self_report', 'verified')) DEFAULT 'self_report',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id);

-- Migrate existing academic data (best effort)
UPDATE public.academic_records
SET 
  academic_year = '2025-2026', -- Default for legacy records
  grade_level = 10,           -- Default assumption
  subject_code = lower(regexp_replace(subject, '[^a-zA-Z0-9]', '_', 'g')),
  score = CASE 
    WHEN gpa_range = 'excellent' THEN 9.0 
    WHEN gpa_range = 'good' THEN 8.0
    WHEN gpa_range = 'average' THEN 6.0
    ELSE 4.0
  END,
  max_score = 10.0
WHERE academic_year IS NULL;

-- Enforce NOT NULL on new mandatory columns
ALTER TABLE public.academic_records 
  ALTER COLUMN academic_year SET NOT NULL,
  ALTER COLUMN grade_level SET NOT NULL,
  ALTER COLUMN subject_code SET NOT NULL,
  ALTER COLUMN source SET NOT NULL;

-- Add Unique Constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS academic_records_unique_idx ON public.academic_records 
(student_id, academic_year, grade_level, semester, subject_code);

-- 3. Refactor student_interests
ALTER TABLE public.student_interests
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS interest_name text,
  ADD COLUMN IF NOT EXISTS intensity smallint CHECK (intensity BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('self_report', 'assessment', 'behavior')) DEFAULT 'self_report',
  ADD COLUMN IF NOT EXISTS confidence numeric DEFAULT 0.5;

-- Migrate existing interest data
UPDATE public.student_interests
SET
  interest_name = interest_area,
  category = 'General',
  intensity = interest_level
WHERE interest_name IS NULL;

-- Enforce NOT NULL
ALTER TABLE public.student_interests
  ALTER COLUMN interest_name SET NOT NULL,
  ALTER COLUMN source SET NOT NULL;

-- Drop old unique constraint and add the new one
ALTER TABLE public.student_interests DROP CONSTRAINT IF EXISTS student_interests_student_id_interest_area_key;
CREATE UNIQUE INDEX IF NOT EXISTS student_interests_unique_source_idx ON public.student_interests 
(student_id, interest_name, source);

-- 4. Tighten student_profiles RLS (Student can ONLY insert own profile)
-- Drop existing insert policy and recreate
DROP POLICY IF EXISTS "Student inserts own profile" ON public.student_profiles;
CREATE POLICY "Student inserts own profile" ON public.student_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id AND 
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'student'
        )
    );

-- 5. Parent-Student Relationship Architecture
CREATE TABLE IF NOT EXISTS public.parent_student_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    relationship_type text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- Anti-self-link
    CONSTRAINT prevent_self_link CHECK (parent_id != student_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS parent_student_active_link_idx ON public.parent_student_links
(parent_id, student_id) WHERE status IN ('pending', 'approved');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.parent_student_links
  FOR EACH ROW EXECUTE PROCEDURE private.set_updated_at();

-- RLS for parent_student_links
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- Students can read links targeting them
CREATE POLICY "Students read own incoming links" ON public.parent_student_links
    FOR SELECT USING (auth.uid() = student_id);

-- Parents can read links they created
CREATE POLICY "Parents read own outgoing links" ON public.parent_student_links
    FOR SELECT USING (auth.uid() = parent_id);

-- 6. Profile Completeness Function (Server-Side)
CREATE OR REPLACE FUNCTION public.calculate_profile_completeness(p_student_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score numeric := 0;
  v_has_profile boolean;
  v_has_academic boolean;
  v_has_interests boolean;
BEGIN
  -- Basic Info (40%)
  SELECT EXISTS(
    SELECT 1 FROM public.student_profiles 
    WHERE id = p_student_id AND region IS NOT NULL AND study_location_pref IS NOT NULL
  ) INTO v_has_profile;
  
  IF v_has_profile THEN v_score := v_score + 40; END IF;

  -- Academic History (30%)
  SELECT EXISTS(
    SELECT 1 FROM public.academic_records WHERE student_id = p_student_id
  ) INTO v_has_academic;
  
  IF v_has_academic THEN v_score := v_score + 30; END IF;

  -- Interests (30%)
  SELECT EXISTS(
    SELECT 1 FROM public.student_interests WHERE student_id = p_student_id
  ) INTO v_has_interests;
  
  IF v_has_interests THEN v_score := v_score + 30; END IF;

  RETURN v_score;
END;
$$;
