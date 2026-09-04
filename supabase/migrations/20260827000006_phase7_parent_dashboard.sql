-- Phase 7: Parent Dashboard Migration
-- 1. Create tables
CREATE TABLE public.parent_link_invitations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- pending, used, expired, revoked
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT parent_link_invitations_pkey PRIMARY KEY (id),
    CONSTRAINT parent_link_invitations_token_hash_key UNIQUE (token_hash)
);

CREATE TABLE public.parent_child_links (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    parent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship_type text NOT NULL DEFAULT 'parent',
    status text NOT NULL DEFAULT 'accepted', -- accepted, revoked
    accepted_at timestamp with time zone DEFAULT now(),
    revoked_at timestamp with time zone,
    revoked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT parent_child_links_pkey PRIMARY KEY (id),
    CONSTRAINT parent_child_links_parent_student_key UNIQUE (parent_id, student_id),
    CONSTRAINT parent_child_links_not_self CHECK (parent_id <> student_id)
);

CREATE TABLE public.parent_sharing_permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    link_id uuid NOT NULL REFERENCES public.parent_child_links(id) ON DELETE CASCADE,
    career_profile_level integer NOT NULL DEFAULT 1,
    assessment_level integer NOT NULL DEFAULT 1,
    roadmap_level integer NOT NULL DEFAULT 1,
    academic_level integer NOT NULL DEFAULT 1,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT parent_sharing_permissions_pkey PRIMARY KEY (id),
    CONSTRAINT parent_sharing_permissions_link_id_key UNIQUE (link_id)
);

CREATE TABLE public.permission_audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_link_id uuid NOT NULL REFERENCES public.parent_child_links(id) ON DELETE CASCADE,
    action text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT permission_audit_logs_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX idx_parent_link_invitations_student_id ON public.parent_link_invitations(student_id);
CREATE INDEX idx_parent_child_links_parent_id ON public.parent_child_links(parent_id);
CREATE INDEX idx_parent_child_links_student_id ON public.parent_child_links(student_id);

-- 2. Trigger for single active invitation
CREATE OR REPLACE FUNCTION public.trg_limit_active_invitation()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'pending' THEN
        UPDATE public.parent_link_invitations
        SET status = 'revoked'
        WHERE student_id = NEW.student_id
          AND status = 'pending'
          AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_active_invitation
    BEFORE INSERT OR UPDATE ON public.parent_link_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_limit_active_invitation();

-- 3. Redemption RPC (Transactional row locking)
CREATE OR REPLACE FUNCTION public.redeem_parent_invitation(
    p_token_hash text,
    p_parent_id uuid,
    p_relationship_type text DEFAULT 'parent'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation record;
    v_link_id uuid;
BEGIN
    -- Select FOR UPDATE to lock the row and prevent concurrent redemptions
    SELECT * INTO v_invitation
    FROM public.parent_link_invitations
    WHERE token_hash = p_token_hash
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid token');
    END IF;

    IF v_invitation.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token is no longer valid');
    END IF;

    IF v_invitation.expires_at < now() THEN
        UPDATE public.parent_link_invitations SET status = 'expired' WHERE id = v_invitation.id;
        RETURN jsonb_build_object('success', false, 'error', 'Token has expired');
    END IF;

    IF v_invitation.student_id = p_parent_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot link to yourself');
    END IF;

    -- Check if link already exists
    IF EXISTS (SELECT 1 FROM public.parent_child_links WHERE parent_id = p_parent_id AND student_id = v_invitation.student_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already linked to this student');
    END IF;

    -- Mark invitation as used
    UPDATE public.parent_link_invitations
    SET status = 'used', used_at = now()
    WHERE id = v_invitation.id;

    -- Create link
    INSERT INTO public.parent_child_links (parent_id, student_id, relationship_type, status, accepted_at)
    VALUES (p_parent_id, v_invitation.student_id, p_relationship_type, 'accepted', now())
    RETURNING id INTO v_link_id;

    -- Create default permissions (Level 1)
    INSERT INTO public.parent_sharing_permissions (link_id, career_profile_level, assessment_level, roadmap_level, academic_level)
    VALUES (v_link_id, 1, 1, 1, 1);

    -- Audit log
    INSERT INTO public.permission_audit_logs (actor_id, target_link_id, action)
    VALUES (p_parent_id, v_link_id, 'accepted_invitation');

    RETURN jsonb_build_object('success', true, 'link_id', v_link_id, 'student_id', v_invitation.student_id);
END;
$$;

-- 4. RLS Helper functions
CREATE OR REPLACE FUNCTION public.get_parent_permission_level(
    p_parent_id uuid,
    p_student_id uuid,
    p_module text -- 'career_profile', 'assessment', 'roadmap', 'academic'
) RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT CASE p_module
        WHEN 'career_profile' THEN p.career_profile_level
        WHEN 'assessment' THEN p.assessment_level
        WHEN 'roadmap' THEN p.roadmap_level
        WHEN 'academic' THEN p.academic_level
        ELSE 0
    END
    FROM public.parent_child_links l
    JOIN public.parent_sharing_permissions p ON p.link_id = l.id
    WHERE l.parent_id = p_parent_id
      AND l.student_id = p_student_id
      AND l.status = 'accepted';
$$;

-- 5. RLS Policies
ALTER TABLE public.parent_link_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own invitations" ON public.parent_link_invitations FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create their own invitations" ON public.parent_link_invitations FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update their own invitations" ON public.parent_link_invitations FOR UPDATE USING (auth.uid() = student_id);

ALTER TABLE public.parent_child_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own links" ON public.parent_child_links FOR SELECT USING (auth.uid() = student_id OR auth.uid() = parent_id);
-- Parents can self-revoke, Students can revoke. Neither can insert directly (handled by RPC)
CREATE POLICY "Users can update their own links" ON public.parent_child_links FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = parent_id)
WITH CHECK (
    -- Only allow updating status to revoked and setting revoked_by to themselves
    status = 'revoked' AND revoked_by = auth.uid()
);

ALTER TABLE public.parent_sharing_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view permissions for their links" ON public.parent_sharing_permissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.parent_child_links l
        WHERE l.id = parent_sharing_permissions.link_id
          AND (l.student_id = auth.uid() OR l.parent_id = auth.uid())
    )
);
CREATE POLICY "Only students can update permissions" ON public.parent_sharing_permissions FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.parent_child_links l
        WHERE l.id = parent_sharing_permissions.link_id
          AND l.student_id = auth.uid()
    )
);

ALTER TABLE public.permission_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view audit logs for their links" ON public.permission_audit_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.parent_child_links l
        WHERE l.id = permission_audit_logs.target_link_id
          AND (l.student_id = auth.uid() OR l.parent_id = auth.uid())
    )
);
-- Append only
CREATE POLICY "Only students can insert audit logs" ON public.permission_audit_logs FOR INSERT WITH CHECK (
    actor_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.parent_child_links l
        WHERE l.id = target_link_id
          AND l.student_id = auth.uid()
    )
);

-- Add parent read policies to existing tables
-- We use the helper function to keep it clean

-- student_career_profiles
CREATE POLICY "Parents can view student career profiles" ON public.student_career_profiles FOR SELECT USING (
    public.get_parent_permission_level(auth.uid(), student_id, 'career_profile') >= 1
);

-- assessment_results
CREATE POLICY "Parents can view assessment results" ON public.assessment_results FOR SELECT USING (
    public.get_parent_permission_level(auth.uid(), student_id, 'assessment') >= 1
);

-- roadmaps
CREATE POLICY "Parents can view roadmaps" ON public.roadmaps FOR SELECT USING (
    public.get_parent_permission_level(auth.uid(), student_id, 'roadmap') >= 1
);

-- roadmap_milestones (derive from roadmap)
CREATE POLICY "Parents can view milestones" ON public.roadmap_milestones FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.roadmaps r
        WHERE r.id = roadmap_id
          AND public.get_parent_permission_level(auth.uid(), r.student_id, 'roadmap') >= 1
    )
);

-- roadmap_tasks (derive from milestone -> roadmap)
CREATE POLICY "Parents can view tasks" ON public.roadmap_tasks FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.roadmap_milestones m
        JOIN public.roadmaps r ON r.id = m.roadmap_id
        WHERE m.id = milestone_id
          AND public.get_parent_permission_level(auth.uid(), r.student_id, 'roadmap') >= 1
    )
);

-- academic_records
CREATE POLICY "Parents can view academic records" ON public.academic_records FOR SELECT USING (
    public.get_parent_permission_level(auth.uid(), student_id, 'academic') >= 1
);
