-- Migration: Bootstrap Super Admin
-- This allows the first user to claim the super_admin role if none exists.

CREATE OR REPLACE FUNCTION public.bootstrap_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Execute as creator (superuser) to bypass RLS
SET search_path = public
AS $$
DECLARE
  super_admin_count integer;
  current_user_id uuid;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if any super_admin already exists
  SELECT count(*) INTO super_admin_count FROM public.user_roles WHERE role = 'super_admin';
  
  IF super_admin_count > 0 THEN
    RAISE EXCEPTION 'Super admin already exists';
  END IF;

  -- Promote the current user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;
