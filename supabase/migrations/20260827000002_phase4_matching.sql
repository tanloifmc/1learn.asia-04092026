-- Migration for Phase 4: Career Matching Engine

-- Create ENUMs
DO $$ BEGIN
    CREATE TYPE public.match_confidence AS ENUM ('high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: student_career_profiles
CREATE TABLE public.student_career_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    profile_version integer NOT NULL,
    evidence_coverage numeric NOT NULL,
    profile_features jsonb NOT NULL DEFAULT '{}'::jsonb,
    source_assessment_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_current boolean NOT NULL DEFAULT true,
    computed_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT student_career_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT student_career_profiles_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
    CONSTRAINT student_career_profiles_evidence_coverage_check CHECK ((evidence_coverage >= (0)::numeric) AND (evidence_coverage <= (1)::numeric)),
    CONSTRAINT student_career_profiles_student_id_profile_version_key UNIQUE (student_id, profile_version)
);

CREATE UNIQUE INDEX student_career_profiles_current_idx ON public.student_career_profiles (student_id) WHERE is_current = true;

-- Table: match_runs
CREATE TABLE public.match_runs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    profile_version integer NOT NULL,
    algorithm_version text NOT NULL,
    evidence_coverage numeric NOT NULL,
    overall_confidence_score numeric NOT NULL,
    overall_confidence_level public.match_confidence NOT NULL,
    status text NOT NULL,
    insufficient_reason text,
    started_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone,
    
    CONSTRAINT match_runs_pkey PRIMARY KEY (id),
    CONSTRAINT match_runs_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
    CONSTRAINT match_runs_evidence_coverage_check CHECK ((evidence_coverage >= (0)::numeric) AND (evidence_coverage <= (1)::numeric)),
    CONSTRAINT match_runs_overall_confidence_score_check CHECK ((overall_confidence_score >= (0)::numeric) AND (overall_confidence_score <= (1)::numeric)),
    CONSTRAINT match_runs_student_profile_algo_unique UNIQUE (student_id, profile_version, algorithm_version)
);

CREATE INDEX match_runs_student_id_idx ON public.match_runs(student_id);
CREATE INDEX match_runs_created_at_idx ON public.match_runs(started_at);

-- Table: career_matches
CREATE TABLE public.career_matches (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    run_id uuid NOT NULL,
    career_id uuid NOT NULL,
    rank integer NOT NULL,
    match_score numeric NOT NULL,
    riasec_score numeric,
    ability_score numeric,
    value_score numeric,
    academic_score numeric,
    effective_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
    confidence_score numeric NOT NULL,
    confidence_level public.match_confidence NOT NULL,
    evidence_coverage numeric NOT NULL,
    factors jsonb NOT NULL DEFAULT '[]'::jsonb,
    gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
    required_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    CONSTRAINT career_matches_pkey PRIMARY KEY (id),
    CONSTRAINT career_matches_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.match_runs (id) ON DELETE CASCADE,
    CONSTRAINT career_matches_career_id_fkey FOREIGN KEY (career_id) REFERENCES public.careers (id) ON DELETE CASCADE,
    CONSTRAINT career_matches_match_score_check CHECK ((match_score >= (0)::numeric) AND (match_score <= (100)::numeric)),
    CONSTRAINT career_matches_riasec_score_check CHECK ((riasec_score >= (0)::numeric) AND (riasec_score <= (100)::numeric)),
    CONSTRAINT career_matches_ability_score_check CHECK ((ability_score >= (0)::numeric) AND (ability_score <= (100)::numeric)),
    CONSTRAINT career_matches_value_score_check CHECK ((value_score >= (0)::numeric) AND (value_score <= (100)::numeric)),
    CONSTRAINT career_matches_academic_score_check CHECK ((academic_score >= (0)::numeric) AND (academic_score <= (100)::numeric)),
    CONSTRAINT career_matches_confidence_score_check CHECK ((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)),
    CONSTRAINT career_matches_evidence_coverage_check CHECK ((evidence_coverage >= (0)::numeric) AND (evidence_coverage <= (1)::numeric)),
    CONSTRAINT career_matches_run_career_unique UNIQUE (run_id, career_id),
    CONSTRAINT career_matches_run_rank_unique UNIQUE (run_id, rank)
);

CREATE INDEX career_matches_run_id_idx ON public.career_matches(run_id);
CREATE INDEX career_matches_rank_idx ON public.career_matches(rank);

-- Enable RLS
ALTER TABLE public.student_career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_matches ENABLE ROW LEVEL SECURITY;

-- Policies for student_career_profiles
CREATE POLICY "Student reads own career profile" ON public.student_career_profiles FOR SELECT USING (student_id = (SELECT auth.uid()));
CREATE POLICY "Admin full access student_career_profiles" ON public.student_career_profiles FOR ALL USING (private.is_content_manager());

-- Policies for match_runs
CREATE POLICY "Student reads own match runs" ON public.match_runs FOR SELECT USING (student_id = (SELECT auth.uid()));
CREATE POLICY "Admin full access match_runs" ON public.match_runs FOR ALL USING (private.is_content_manager());

-- Policies for career_matches
CREATE POLICY "Student reads own career matches" ON public.career_matches FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.match_runs mr 
        WHERE mr.id = career_matches.run_id AND mr.student_id = (SELECT auth.uid())
    )
);
CREATE POLICY "Admin full access career_matches" ON public.career_matches FOR ALL USING (private.is_content_manager());

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.career_matches;
