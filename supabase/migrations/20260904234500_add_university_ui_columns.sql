-- Migration: Add missing UI columns for universities
BEGIN;

ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS hero_images text[],
ADD COLUMN IF NOT EXISTS highlights jsonb DEFAULT '[]'::jsonb;

COMMIT;
