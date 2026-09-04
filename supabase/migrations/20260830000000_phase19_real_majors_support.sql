-- Phase 19: Real Majors Support
-- Converts university_majors into the definitive Actual Majors table
-- Decouples from the strict 50 1learn taxonomy

BEGIN;

-- 1. Remove the old unique constraint (university_id, major_id, program_type)
ALTER TABLE public.university_majors
DROP CONSTRAINT IF EXISTS uni_major_program_unique;

-- 2. Make major_id nullable
ALTER TABLE public.university_majors
ALTER COLUMN major_id DROP NOT NULL;

-- 3. Add necessary columns for Actual Majors
ALTER TABLE public.university_majors
ADD COLUMN IF NOT EXISTS original_major_code text NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN IF NOT EXISTS original_major_name text NOT NULL DEFAULT 'Unknown Major',
ADD COLUMN IF NOT EXISTS mapping_status text NOT NULL DEFAULT 'UNMAPPED',
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS source_url text;

-- 4. Create new unique constraint
-- Audit showed 168 duplicate codes in Candidate JSON (e.g., military gender splits, HQ programs).
-- So original_major_name MUST be part of the constraint to prevent data loss.
ALTER TABLE public.university_majors
ADD CONSTRAINT uni_major_real_world_unique UNIQUE (university_id, original_major_code, original_major_name);

-- 5. Add index for faster queries on status and codes
CREATE INDEX IF NOT EXISTS idx_uni_majors_mapping_status ON public.university_majors(mapping_status);
CREATE INDEX IF NOT EXISTS idx_uni_majors_orig_code ON public.university_majors(original_major_code);

COMMIT;
