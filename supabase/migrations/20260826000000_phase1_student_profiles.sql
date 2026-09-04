-- Migration: Phase 1 Student Profiles & Onboarding
-- Creates tables for student profiles, academic records, and student interests.

-- 1. student_profiles
CREATE TABLE public.student_profiles (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    grade smallint CHECK (grade IN (9, 10, 11, 12)),
    birth_year smallint,
    gender text,
    region text,
    study_location_pref text,
    family_support_level smallint CHECK (family_support_level BETWEEN 1 AND 5),
    onboarding_step smallint DEFAULT 1,
    onboarding_completed_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger to auto-update updated_at for student_profiles
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE PROCEDURE private.set_updated_at();

-- RLS: student_profiles
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student reads own profile" ON public.student_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Student updates own profile" ON public.student_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Student inserts own profile" ON public.student_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin reads all student profiles" ON public.student_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'super_admin')
        )
    );

-- 2. academic_records
CREATE TABLE public.academic_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject text NOT NULL,
    performance_level text CHECK (performance_level IN ('strong', 'average', 'weak')),
    gpa_range text CHECK (gpa_range IN ('excellent', 'good', 'average', 'below_average')),
    semester text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX academic_records_student_id_idx ON public.academic_records (student_id);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.academic_records
  FOR EACH ROW EXECUTE PROCEDURE private.set_updated_at();

-- RLS: academic_records
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student manages own academic records" ON public.academic_records
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Admin reads all academic records" ON public.academic_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'super_admin')
        )
    );

-- 3. student_interests
CREATE TABLE public.student_interests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_area text NOT NULL,
    interest_level smallint CHECK (interest_level BETWEEN 1 AND 5),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (student_id, interest_area)
);

CREATE INDEX student_interests_student_id_idx ON public.student_interests (student_id);

-- RLS: student_interests
ALTER TABLE public.student_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student manages own interests" ON public.student_interests
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Admin reads all interests" ON public.student_interests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'super_admin')
        )
    );

