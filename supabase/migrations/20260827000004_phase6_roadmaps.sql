-- Migration for Phase 6: Personal Roadmaps
-- Adheres to the Seed-Driven Development and Gap-Driven Engine architecture.

-- ==============================================================================
-- 1. ENUMS
-- ==============================================================================
CREATE TYPE requirement_type AS ENUM ('academic', 'skill', 'experience', 'certification', 'other');
CREATE TYPE requirement_verification_status AS ENUM ('draft', 'verified', 'published', 'archived');
CREATE TYPE roadmap_status AS ENUM ('active', 'archived');
CREATE TYPE roadmap_task_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

-- 2.1 TARGET REQUIREMENTS
CREATE TABLE public.target_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type text NOT NULL CHECK (target_type IN ('university_major', 'career')),
    target_id uuid NOT NULL,
    requirement_code text NOT NULL,
    requirement_type requirement_type NOT NULL,
    comparison_operator text NOT NULL,
    requirement_value text NOT NULL,
    unit text NOT NULL,
    importance text NOT NULL CHECK (importance IN ('critical', 'high', 'medium', 'low')),
    status requirement_verification_status NOT NULL DEFAULT 'draft',
    source text,
    source_url text,
    last_verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_target_reqs_target_id ON target_requirements(target_id);
CREATE INDEX idx_target_reqs_status ON target_requirements(status);

-- 2.2 ROADMAPS
CREATE TABLE public.roadmaps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_career_id uuid REFERENCES public.careers(id),
    target_major_id uuid REFERENCES public.majors(id),
    target_university_id uuid REFERENCES public.universities(id),
    target_program_id uuid REFERENCES public.university_majors(id),
    roadmap_version integer NOT NULL DEFAULT 1,
    generator_version text NOT NULL,
    profile_version integer NOT NULL,
    academic_data_version timestamptz NOT NULL,
    status roadmap_status NOT NULL DEFAULT 'active',
    generated_at timestamptz NOT NULL DEFAULT now(),
    archived_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Partial unique index to enforce ONLY ONE active roadmap per student
CREATE UNIQUE INDEX idx_roadmaps_active_single ON roadmaps (student_id) WHERE status = 'active';

CREATE INDEX idx_roadmaps_student_id ON roadmaps(student_id);

CREATE TRIGGER handle_updated_at_roadmaps 
BEFORE UPDATE ON roadmaps 
FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- 2.3 ROADMAP MILESTONES
CREATE TABLE public.roadmap_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id uuid NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    target_date date,
    priority text NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    source_requirement_id uuid REFERENCES public.target_requirements(id) ON DELETE SET NULL,
    status roadmap_task_status NOT NULL DEFAULT 'pending',
    order_index integer NOT NULL DEFAULT 0,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_roadmap_milestones_roadmap_id ON roadmap_milestones(roadmap_id);

-- 2.4 ROADMAP TASKS
CREATE TABLE public.roadmap_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id uuid NOT NULL REFERENCES public.roadmap_milestones(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    task_type text NOT NULL,
    priority text NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    due_date date,
    estimated_effort text,
    status roadmap_task_status NOT NULL DEFAULT 'pending',
    source_requirement_id uuid REFERENCES public.target_requirements(id) ON DELETE SET NULL,
    depends_on uuid REFERENCES public.roadmap_tasks(id) ON DELETE SET NULL,
    evidence_required boolean NOT NULL DEFAULT false,
    evidence_type text NOT NULL DEFAULT 'none',
    completion_evidence text,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_roadmap_tasks_milestone_id ON roadmap_tasks(milestone_id);
CREATE INDEX idx_roadmap_tasks_status ON roadmap_tasks(status);
CREATE INDEX idx_roadmap_tasks_due_date ON roadmap_tasks(due_date);

CREATE TRIGGER handle_updated_at_roadmap_tasks 
BEFORE UPDATE ON roadmap_tasks 
FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);


-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.target_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_tasks ENABLE ROW LEVEL SECURITY;

-- target_requirements: Public read, Admin manage
CREATE POLICY "Public can read verified requirements"
ON public.target_requirements FOR SELECT
TO authenticated, anon
USING (status = 'verified' OR status = 'published');

-- roadmaps: Student reads own, Admin reads all
CREATE POLICY "Students can view their own roadmaps"
ON public.roadmaps FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- roadmap_milestones: Student reads own via roadmap_id
CREATE POLICY "Students can view their own milestones"
ON public.roadmap_milestones FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.roadmaps r
    WHERE r.id = roadmap_milestones.roadmap_id
    AND r.student_id = auth.uid()
  )
);

-- roadmap_tasks: Student reads own via milestone_id
CREATE POLICY "Students can view their own tasks"
ON public.roadmap_tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.roadmap_milestones m
    JOIN public.roadmaps r ON m.roadmap_id = r.id
    WHERE m.id = roadmap_tasks.milestone_id
    AND r.student_id = auth.uid()
  )
);

-- roadmap_tasks: Student can update status/evidence of their own tasks
CREATE POLICY "Students can update their own task status"
ON public.roadmap_tasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.roadmap_milestones m
    JOIN public.roadmaps r ON m.roadmap_id = r.id
    WHERE m.id = roadmap_tasks.milestone_id
    AND r.student_id = auth.uid()
  )
);
