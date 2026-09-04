-- Add student and parent roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';

-- Update the handle_new_user trigger to read the role from user metadata
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested_role text;
  assigned_role public.app_role;
BEGIN
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  requested_role := new.raw_user_meta_data ->> 'role';
  
  -- Only allow student or parent or user to be requested on signup
  IF requested_role = 'student' THEN
    assigned_role := 'student'::public.app_role;
  ELSIF requested_role = 'parent' THEN
    assigned_role := 'parent'::public.app_role;
  ELSE
    assigned_role := 'user'::public.app_role;
  END IF;

  insert into public.user_roles (user_id, role)
  values (new.id, assigned_role);

  return new;
END;
$$;
