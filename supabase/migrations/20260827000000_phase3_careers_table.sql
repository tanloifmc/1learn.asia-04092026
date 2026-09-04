-- Migration 20260827000000_phase3_careers_table.sql

-- 1. Create Enums
CREATE TYPE career_status AS ENUM ('draft', 'needs_verification', 'verified', 'published', 'archived');

-- 2. Create IMMUTABLE function to calculate primary RIASEC code from profile vector
CREATE OR REPLACE FUNCTION get_primary_riasec(profile jsonb)
RETURNS char(1)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    k text;
    v numeric;
    max_k text;
    max_v numeric := -1;
BEGIN
    IF profile IS NULL OR jsonb_typeof(profile) != 'object' THEN
        RETURN NULL;
    END IF;

    FOR k, v IN SELECT * FROM jsonb_each_text(profile)
    LOOP
        IF CAST(v AS numeric) > max_v THEN
            max_v := CAST(v AS numeric);
            max_k := k;
        END IF;
    END LOOP;

    RETURN CAST(max_k AS char(1));
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

-- 3. Create careers table
CREATE TABLE careers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    name text NOT NULL,
    name_en text,
    slug text NOT NULL,
    career_domain_code text NOT NULL,
    description text,
    daily_tasks jsonb,
    work_environment text,
    skills jsonb,
    tools_used jsonb,
    education_paths jsonb,
    career_paths jsonb,
    related_careers jsonb,
    market_data jsonb,
    good_fit_indicators jsonb,
    possible_challenges jsonb,
    work_style jsonb,
    company_examples jsonb,
    riasec_profile jsonb,
    riasec_primary char(1) GENERATED ALWAYS AS (get_primary_riasec(riasec_profile)) STORED,
    ability_weights jsonb,
    status career_status NOT NULL DEFAULT 'draft',
    source text,
    source_url text,
    source_type text,
    published_at timestamptz,
    last_verified_at timestamptz,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    verified_by uuid REFERENCES auth.users(id),
    published_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT careers_code_unique UNIQUE (code),
    CONSTRAINT careers_slug_unique UNIQUE (slug),
    CONSTRAINT careers_code_check CHECK (code ~ '^[A-Z0-9_]+$'),
    CONSTRAINT careers_slug_check CHECK (slug ~ '^[a-z0-9\-]+$'),
    
    -- Basic JSONB integrity checks
    CONSTRAINT careers_skills_check CHECK (skills IS NULL OR jsonb_typeof(skills) = 'array'),
    CONSTRAINT careers_daily_tasks_check CHECK (daily_tasks IS NULL OR jsonb_typeof(daily_tasks) = 'array'),
    CONSTRAINT careers_tools_used_check CHECK (tools_used IS NULL OR jsonb_typeof(tools_used) = 'array'),
    CONSTRAINT careers_education_paths_check CHECK (education_paths IS NULL OR jsonb_typeof(education_paths) = 'array'),
    CONSTRAINT careers_career_paths_check CHECK (career_paths IS NULL OR jsonb_typeof(career_paths) = 'object'),
    CONSTRAINT careers_related_careers_check CHECK (related_careers IS NULL OR jsonb_typeof(related_careers) = 'object'),
    CONSTRAINT careers_market_data_check CHECK (market_data IS NULL OR jsonb_typeof(market_data) = 'object'),
    CONSTRAINT careers_riasec_profile_check CHECK (riasec_profile IS NULL OR jsonb_typeof(riasec_profile) = 'object'),
    CONSTRAINT careers_ability_weights_check CHECK (ability_weights IS NULL OR jsonb_typeof(ability_weights) = 'object')
);

-- Indexes
CREATE INDEX idx_careers_domain ON careers(career_domain_code);
CREATE INDEX idx_careers_status ON careers(status);
CREATE INDEX idx_careers_riasec_primary ON careers(riasec_primary);
CREATE INDEX idx_careers_code ON careers(code);

-- 4. Create career_audit_log table
CREATE TABLE career_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id uuid NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    action text NOT NULL,
    from_status career_status,
    to_status career_status,
    changed_by uuid REFERENCES auth.users(id),
    changed_at timestamptz NOT NULL DEFAULT now(),
    metadata jsonb
);

CREATE INDEX idx_career_audit_log_career_id ON career_audit_log(career_id);
CREATE INDEX idx_career_audit_log_changed_at ON career_audit_log(changed_at);

-- 5. Triggers for Careers

-- Trigger to downgrade status if published content changes
CREATE OR REPLACE FUNCTION trigger_check_career_content_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is staying 'published' but content fields changed
    IF OLD.status = 'published' AND NEW.status = 'published' THEN
        IF OLD.name IS DISTINCT FROM NEW.name OR
           OLD.career_domain_code IS DISTINCT FROM NEW.career_domain_code OR
           OLD.description IS DISTINCT FROM NEW.description OR
           OLD.skills IS DISTINCT FROM NEW.skills OR
           OLD.market_data IS DISTINCT FROM NEW.market_data OR
           OLD.riasec_profile IS DISTINCT FROM NEW.riasec_profile THEN
            
            -- Downgrade status
            NEW.status := 'needs_verification';
        END IF;
    END IF;
    
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER careers_before_update
BEFORE UPDATE ON careers
FOR EACH ROW
EXECUTE FUNCTION trigger_check_career_content_change();

-- Trigger to create audit log
CREATE OR REPLACE FUNCTION trigger_career_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    audit_action text;
BEGIN
    IF TG_OP = 'INSERT' THEN
        audit_action := 'create';
        INSERT INTO career_audit_log (career_id, action, to_status, changed_by, metadata)
        VALUES (NEW.id, audit_action, NEW.status, NEW.created_by, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'needs_verification' THEN audit_action := 'flag_needs_verification';
            ELSIF NEW.status = 'verified' THEN audit_action := 'verify';
            ELSIF NEW.status = 'published' THEN audit_action := 'publish';
            ELSIF NEW.status = 'archived' THEN audit_action := 'archive';
            ELSIF NEW.status = 'draft' THEN audit_action := 'draft';
            ELSE audit_action := 'update_status';
            END IF;
        ELSE
            audit_action := 'update';
        END IF;

        INSERT INTO career_audit_log (career_id, action, from_status, to_status, changed_by, metadata)
        VALUES (NEW.id, audit_action, OLD.status, NEW.status, NEW.updated_by, jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'name_changed', OLD.name IS DISTINCT FROM NEW.name
        ));
    ELSIF TG_OP = 'DELETE' THEN
        audit_action := 'delete';
        INSERT INTO career_audit_log (career_id, action, from_status, changed_by)
        VALUES (OLD.id, audit_action, OLD.status, auth.uid());
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER careers_after_change
AFTER INSERT OR UPDATE OR DELETE ON careers
FOR EACH ROW
EXECUTE FUNCTION trigger_career_audit_log();

-- 6. RLS Policies

ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_audit_log ENABLE ROW LEVEL SECURITY;

-- Careers RLS
-- Students/Public can read ONLY published careers
CREATE POLICY "Public can view published careers"
    ON careers
    FOR SELECT
    USING (status = 'published');

-- Admins can do anything
CREATE POLICY "Admins can manage careers"
    ON careers
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND (user_roles.role = 'admin' OR user_roles.role = 'super_admin')
        )
    );

-- Career Audit Log RLS
-- Only admins can read
CREATE POLICY "Admins can view career audit log"
    ON career_audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND (user_roles.role = 'admin' OR user_roles.role = 'super_admin')
        )
    );
