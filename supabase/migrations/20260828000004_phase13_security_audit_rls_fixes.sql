-- Phase 13: Security Audit RLS Fixes
-- Enable Row Level Security (RLS) on backup tables to prevent unauthorized access via PostgREST API
-- Without adding any policies, these tables will default to deny-all for all public roles (anon, authenticated),
-- ensuring they remain accessible only to service_role and postgres superuser.

ALTER TABLE IF EXISTS public.backup_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.backup_student_interests ENABLE ROW LEVEL SECURITY;
