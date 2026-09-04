-- Phase 12: Data Provenance & Eligibility
-- Ensure we can track which data is safe for recommendations (Launch-Critical Tier A)

-- 1. Add version tracking to match_runs
ALTER TABLE public.match_runs 
ADD COLUMN IF NOT EXISTS assessment_version text NOT NULL DEFAULT 'v1.0.0',
ADD COLUMN IF NOT EXISTS scoring_version text NOT NULL DEFAULT 'v1.0.0',
ADD COLUMN IF NOT EXISTS profile_version text NOT NULL DEFAULT 'v1.0.0',
ADD COLUMN IF NOT EXISTS matching_algorithm_version text NOT NULL DEFAULT 'v1.0.0';

-- 2. Add Explicit Data Eligibility flag
-- Instead of blocking incomplete data (which is useful for Explorer), 
-- we flag records that are safe for the Recommendation Engine.
ALTER TABLE public.careers
ADD COLUMN IF NOT EXISTS is_production_eligible boolean NOT NULL DEFAULT false;

ALTER TABLE public.majors
ADD COLUMN IF NOT EXISTS is_production_eligible boolean NOT NULL DEFAULT false;

ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS is_production_eligible boolean NOT NULL DEFAULT false;

ALTER TABLE public.admission_data
ADD COLUMN IF NOT EXISTS is_production_eligible boolean NOT NULL DEFAULT false;

ALTER TABLE public.target_requirements
ADD COLUMN IF NOT EXISTS is_production_eligible boolean NOT NULL DEFAULT false;

-- 3. Update existing data to NOT be eligible by default (Pre-migration validation showed 503 missing source_url)
UPDATE public.careers SET is_production_eligible = false;
UPDATE public.majors SET is_production_eligible = false;
UPDATE public.universities SET is_production_eligible = false;
UPDATE public.admission_data SET is_production_eligible = false;
UPDATE public.target_requirements SET is_production_eligible = false;
