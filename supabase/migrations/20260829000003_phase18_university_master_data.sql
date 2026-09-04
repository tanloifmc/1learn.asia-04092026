-- Phase 18: University Master Data Spec Updates
-- Adds missing provenance and descriptive columns for universities and their majors

BEGIN;

-- 1. Add columns to universities table
ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS admissions_website text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS ownership text,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'PENDING_VERIFICATION';

-- Ensure status is valid
ALTER TABLE public.universities
ADD CONSTRAINT universities_verification_status_check 
CHECK (verification_status IN ('PENDING_VERIFICATION', 'INCOMPLETE', 'CURATED', 'VERIFIED'));

-- 2. Add columns to university_majors table
ALTER TABLE public.university_majors
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'PENDING_VERIFICATION';

-- Ensure status is valid
ALTER TABLE public.university_majors
ADD CONSTRAINT university_majors_verification_status_check 
CHECK (verification_status IN ('PENDING_VERIFICATION', 'INCOMPLETE', 'CURATED', 'VERIFIED'));

-- 3. If missing, verify foreign keys for verified_by
-- Check if the constraint exists, if not, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'universities_verified_by_fkey') THEN
        ALTER TABLE public.universities
        ADD CONSTRAINT universities_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'university_majors_verified_by_fkey') THEN
        ALTER TABLE public.university_majors
        ADD CONSTRAINT university_majors_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMIT;
