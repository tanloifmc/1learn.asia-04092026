-- 1. Add is_demo flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- 2. Create index for fast filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo ON public.profiles(is_demo);

-- 3. Create helper functions for identity verification
-- Usage in business logic/queries: WHERE public.is_real_user(student_id)
CREATE OR REPLACE FUNCTION public.is_demo_user(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT COALESCE((SELECT is_demo FROM public.profiles WHERE id = check_user_id), false);
$$;

CREATE OR REPLACE FUNCTION public.is_real_user(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT NOT public.is_demo_user(check_user_id);
$$;
