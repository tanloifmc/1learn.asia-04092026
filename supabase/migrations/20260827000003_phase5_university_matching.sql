-- Migration: Phase 5 - Major & University Taxonomy and Matching
-- This migration establishes the University Recommendation Engine infrastructure.

-- ENUMs
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TYPE major_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE university_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE mapping_relationship_type AS ENUM ('primary', 'related', 'alternative');
CREATE TYPE admission_data_status AS ENUM ('draft', 'verified', 'published', 'archived');
CREATE TYPE recommendation_tier AS ENUM ('Dream', 'Match', 'Safer Option', 'Insufficient Data', 'Unrated');
CREATE TYPE data_quality_level AS ENUM ('High', 'Medium', 'Low');

-- 1. majors
CREATE TABLE majors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text, -- e.g. "7480101"
  slug text UNIQUE NOT NULL,
  field text NOT NULL,
  description text,
  status major_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_majors_field ON majors(field);
CREATE INDEX idx_majors_status ON majors(status);

-- 2. career_major_mappings
CREATE TABLE career_major_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  major_id uuid NOT NULL REFERENCES majors(id) ON DELETE CASCADE,
  relationship_type mapping_relationship_type NOT NULL,
  relevance_score numeric(3,2) NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1.0),
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_major_unique UNIQUE(career_id, major_id)
);

CREATE INDEX idx_cmm_career ON career_major_mappings(career_id);
CREATE INDEX idx_cmm_major ON career_major_mappings(major_id);

-- 3. universities
CREATE TABLE universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  slug text UNIQUE NOT NULL,
  location_city text,
  location_region text,
  type text, -- 'public', 'private', 'international'
  scale text, -- 'small', 'medium', 'large'
  description text,
  tuition_range_per_year numeric[], -- [min, max]
  status university_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_universities_region ON universities(location_region);
CREATE INDEX idx_universities_status ON universities(status);

-- 4. university_majors
CREATE TABLE university_majors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  major_id uuid NOT NULL REFERENCES majors(id) ON DELETE CASCADE,
  program_name text, -- e.g. "Khoa học máy tính chất lượng cao"
  degree_level text, -- e.g. "Bachelor"
  campus text,
  program_type text, -- e.g. "Standard", "High Quality", "International"
  active_from smallint,
  active_until smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uni_major_program_unique UNIQUE(university_id, major_id, program_type)
);

CREATE INDEX idx_uni_majors_uni ON university_majors(university_id);
CREATE INDEX idx_uni_majors_major ON university_majors(major_id);

-- 5. admission_data
CREATE TABLE admission_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_major_id uuid NOT NULL REFERENCES university_majors(id) ON DELETE CASCADE,
  academic_year smallint NOT NULL,
  admission_method text NOT NULL, -- e.g. "THPT", "DGNL-HCM", "IELTS"
  subject_combination text, -- e.g. "A00, A01"
  cutoff_score numeric NOT NULL,
  score_scale numeric NOT NULL, -- e.g. 30, 1200, 4.0
  quota integer,
  source_url text,
  last_verified_at timestamptz,
  verified_by text,
  data_status admission_data_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admission_data_unique UNIQUE(university_major_id, academic_year, admission_method, subject_combination)
);

CREATE INDEX idx_admission_data_uni_major ON admission_data(university_major_id);
CREATE INDEX idx_admission_data_year ON admission_data(academic_year);
CREATE INDEX idx_admission_data_method ON admission_data(admission_method);

-- 6. university_recommendation_runs
CREATE TABLE university_recommendation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  profile_version integer NOT NULL,
  algorithm_version text NOT NULL,
  data_reference_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uni_run_unique UNIQUE(student_id, profile_version, algorithm_version)
);

CREATE INDEX idx_uni_run_student ON university_recommendation_runs(student_id);

-- 7. student_university_recommendations
CREATE TABLE student_university_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES university_recommendation_runs(id) ON DELETE CASCADE,
  university_id uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  major_id uuid NOT NULL REFERENCES majors(id) ON DELETE CASCADE,
  admission_method text,
  historical_years_used smallint[],
  admission_fit_score numeric(5,2) CHECK (admission_fit_score >= 0 AND admission_fit_score <= 100),
  university_fit_score numeric(5,2) CHECK (university_fit_score >= 0 AND university_fit_score <= 100),
  fit_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  tier recommendation_tier NOT NULL,
  data_quality data_quality_level NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_uni_rec_unique UNIQUE(run_id, university_id, major_id, admission_method)
);

CREATE INDEX idx_student_uni_rec_run ON student_university_recommendations(run_id);
CREATE INDEX idx_student_uni_rec_tier ON student_university_recommendations(tier);

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_majors BEFORE UPDATE ON majors FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER handle_updated_at_universities BEFORE UPDATE ON universities FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS Setup
ALTER TABLE majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_major_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_recommendation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_university_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Public/Read-only for Explorer Data)
CREATE POLICY "Public read majors" ON majors FOR SELECT USING (status = 'published');
CREATE POLICY "Public read career_major_mappings" ON career_major_mappings FOR SELECT USING (true);
CREATE POLICY "Public read universities" ON universities FOR SELECT USING (status = 'published');
CREATE POLICY "Public read university_majors" ON university_majors FOR SELECT USING (true);
CREATE POLICY "Public read admission_data" ON admission_data FOR SELECT USING (data_status = 'published');

-- RLS Policies (Private for Runs and Recommendations)
CREATE POLICY "Users can read own uni recommendation runs" ON university_recommendation_runs
  FOR SELECT USING (auth.uid() = student_id);

-- System creates runs, user only reads
CREATE POLICY "Users can read own uni recommendations" ON student_university_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM university_recommendation_runs r
      WHERE r.id = student_university_recommendations.run_id
      AND r.student_id = auth.uid()
    )
  );
