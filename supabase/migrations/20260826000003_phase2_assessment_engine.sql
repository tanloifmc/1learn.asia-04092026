-- Phase 2: Assessment Engine V1

-- Types
CREATE TYPE public.assessment_lifecycle_status AS ENUM ('draft', 'review', 'internal_test', 'published', 'archived');
CREATE TYPE public.assessment_session_status AS ENUM ('in_progress', 'abandoned', 'completed');
CREATE TYPE public.confidence_level AS ENUM ('High', 'Medium', 'Low');

-- 1. assessments
CREATE TABLE public.assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. assessment_versions
CREATE TABLE public.assessment_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    version_tag text NOT NULL,
    status public.assessment_lifecycle_status NOT NULL DEFAULT 'draft',
    scoring_rules_version text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(assessment_id, version_tag)
);

-- 3. assessment_dimensions
CREATE TABLE public.assessment_dimensions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id uuid NOT NULL REFERENCES public.assessment_versions(id) ON DELETE CASCADE,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    UNIQUE(version_id, code)
);

-- 4. assessment_questions
CREATE TABLE public.assessment_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id uuid NOT NULL REFERENCES public.assessment_versions(id) ON DELETE CASCADE,
    dimension_id uuid NOT NULL REFERENCES public.assessment_dimensions(id) ON DELETE CASCADE,
    order_index integer NOT NULL,
    question_text text NOT NULL,
    is_reverse_scored boolean NOT NULL DEFAULT false,
    weight numeric NOT NULL DEFAULT 1.0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. assessment_question_options (Optional for multiple choice, scale usually can be implicit, but good to have)
CREATE TABLE public.assessment_question_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    option_value numeric NOT NULL,
    order_index integer NOT NULL
);

-- 6. assessment_sessions
CREATE TABLE public.assessment_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    version_id uuid NOT NULL REFERENCES public.assessment_versions(id) ON DELETE CASCADE,
    status public.assessment_session_status NOT NULL DEFAULT 'in_progress',
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. assessment_responses
CREATE TABLE public.assessment_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    response_value numeric NOT NULL,
    response_json jsonb,
    answered_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(session_id, question_id) -- Ensures idempotency
);

-- 8. assessment_results
CREATE TABLE public.assessment_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    version_id uuid NOT NULL REFERENCES public.assessment_versions(id) ON DELETE CASCADE,
    scoring_version text NOT NULL,
    completion_quality jsonb NOT NULL,
    confidence jsonb NOT NULL,
    is_current boolean NOT NULL DEFAULT true,
    completed_at timestamptz NOT NULL DEFAULT now()
);

-- Protect is_current to prevent duplicate current results
CREATE UNIQUE INDEX assessment_results_current_idx ON public.assessment_results (student_id, version_id) WHERE is_current = true;

-- 9. assessment_result_dimensions
CREATE TABLE public.assessment_result_dimensions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id uuid NOT NULL REFERENCES public.assessment_results(id) ON DELETE CASCADE,
    dimension_id uuid NOT NULL REFERENCES public.assessment_dimensions(id) ON DELETE CASCADE,
    score numeric NOT NULL,
    UNIQUE(result_id, dimension_id)
);

-- 10. derived_profile_signals
CREATE TABLE public.derived_profile_signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    signal_type text NOT NULL,
    value numeric NOT NULL,
    source_type text NOT NULL,
    source_id uuid NOT NULL REFERENCES public.assessment_results(id) ON DELETE CASCADE,
    source_version text NOT NULL,
    confidence numeric NOT NULL,
    valid_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(source_id, signal_type)
);


-- TRIGGERS
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE PROCEDURE private.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.assessment_sessions FOR EACH ROW EXECUTE PROCEDURE private.set_updated_at();

-- RLS POLICIES

-- Admins can read all, students can read published or active session ones.
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_result_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.derived_profile_signals ENABLE ROW LEVEL SECURITY;

-- Read policies for base tables (Assessments, Versions, Dimensions)
CREATE POLICY "Public reads published versions" ON public.assessment_versions
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public reads assessments" ON public.assessments
    FOR SELECT USING (true); -- Usually safe to expose names

CREATE POLICY "Public reads published dimensions" ON public.assessment_dimensions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessment_versions
            WHERE assessment_versions.id = version_id AND assessment_versions.status = 'published'
        )
    );

-- STRICT POLICY: Students read questions ONLY if they have an active session for that version, AND the version is published.
CREATE POLICY "Student reads questions via session" ON public.assessment_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessment_sessions s
            JOIN public.assessment_versions v ON v.id = s.version_id
            WHERE s.version_id = assessment_questions.version_id 
              AND s.student_id = auth.uid()
              AND s.status = 'in_progress'
              AND v.status IN ('published', 'internal_test')
        )
    );

-- Student Session & Response Isolation
CREATE POLICY "Student manages own sessions" ON public.assessment_sessions
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Student manages own responses" ON public.assessment_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.assessment_sessions s
            WHERE s.id = session_id AND s.student_id = auth.uid()
        )
    );

-- Results are READ ONLY for Students
CREATE POLICY "Student reads own results" ON public.assessment_results
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Student reads own result dimensions" ON public.assessment_result_dimensions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessment_results r
            WHERE r.id = result_id AND r.student_id = auth.uid()
        )
    );

CREATE POLICY "Student reads own derived signals" ON public.derived_profile_signals
    FOR SELECT USING (student_id = auth.uid());

-- Admin full access across everything
CREATE POLICY "Admin full access assessments" ON public.assessments FOR ALL USING (private.is_content_manager());
CREATE POLICY "Admin full access assessment_versions" ON public.assessment_versions FOR ALL USING (private.is_content_manager());
CREATE POLICY "Admin full access assessment_dimensions" ON public.assessment_dimensions FOR ALL USING (private.is_content_manager());
CREATE POLICY "Admin full access assessment_questions" ON public.assessment_questions FOR ALL USING (private.is_content_manager());
CREATE POLICY "Admin full access assessment_question_options" ON public.assessment_question_options FOR ALL USING (private.is_content_manager());
CREATE POLICY "Admin full access assessment_sessions" ON public.assessment_sessions FOR ALL USING (private.is_content_manager());
CREATE POLICY "Admin full access assessment_responses" ON public.assessment_responses FOR ALL USING (private.is_content_manager());
CREATE POLICY "Admin full access assessment_results" ON public.assessment_results FOR ALL USING (private.is_content_manager());
CREATE POLICY "Admin full access assessment_result_dimensions" ON public.assessment_result_dimensions FOR ALL USING (private.is_content_manager());
CREATE POLICY "Admin full access derived_profile_signals" ON public.derived_profile_signals FOR ALL USING (private.is_content_manager());
