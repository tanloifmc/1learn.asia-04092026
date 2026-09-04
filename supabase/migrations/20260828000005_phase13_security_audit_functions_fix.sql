-- Phase 13: Security Audit - Functions Hardening
-- Fixes for Supabase Linter warnings: function_search_path_mutable and anon_security_definer_function_executable

-- 1. Fix Mutable Search Path (Add SET search_path = public)
ALTER FUNCTION public.calculate_profile_completeness(uuid) SET search_path = public;
ALTER FUNCTION public.get_primary_riasec(jsonb) SET search_path = public;
ALTER FUNCTION public.trigger_check_career_content_change() SET search_path = public;
ALTER FUNCTION public.trigger_career_audit_log() SET search_path = public;
ALTER FUNCTION public.trg_limit_active_invitation() SET search_path = public;
ALTER FUNCTION public.redeem_parent_invitation(text, uuid, text) SET search_path = public;
ALTER FUNCTION public.get_parent_permission_level(uuid, uuid, text) SET search_path = public;
ALTER FUNCTION public.save_assessment_result(uuid, uuid, uuid, text, jsonb, jsonb, jsonb, jsonb) SET search_path = public;
ALTER FUNCTION public.bootstrap_super_admin() SET search_path = public;

-- 2. Revoke Execute from PUBLIC for sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.calculate_profile_completeness(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_profile_completeness(uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.redeem_parent_invitation(text, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_parent_invitation(text, uuid, text) FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_parent_permission_level(uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_parent_permission_level(uuid, uuid, text) FROM anon;

REVOKE EXECUTE ON FUNCTION public.save_assessment_result(uuid, uuid, uuid, text, jsonb, jsonb, jsonb, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_assessment_result(uuid, uuid, uuid, text, jsonb, jsonb, jsonb, jsonb) FROM anon;

REVOKE EXECUTE ON FUNCTION public.trigger_career_audit_log() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_career_audit_log() FROM anon;
REVOKE EXECUTE ON FUNCTION public.trigger_career_audit_log() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.trigger_check_career_content_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_check_career_content_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.trigger_check_career_content_change() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.trg_limit_active_invitation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_limit_active_invitation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_limit_active_invitation() FROM authenticated;

-- Ensure authenticated roles CAN execute the RPCs they need (if we revoked from PUBLIC)
GRANT EXECUTE ON FUNCTION public.calculate_profile_completeness(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_parent_invitation(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_permission_level(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_assessment_result(uuid, uuid, uuid, text, jsonb, jsonb, jsonb, jsonb) TO authenticated;
