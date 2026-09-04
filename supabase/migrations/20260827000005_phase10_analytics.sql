-- Phase 10: Admin & Analytics

-- 1. Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT, -- To track anonymous users or link multiple events
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies for analytics_events
-- 1. Users can insert their own events (or anonymous events if user_id is null)
CREATE POLICY "Users can insert analytics events" 
    ON public.analytics_events 
    FOR INSERT 
    WITH CHECK (true); -- Allow all inserts (client side tracking). We will manage malicious inserts via application logic if necessary.

-- 2. Only admins can select/view analytics
CREATE POLICY "Admins can view analytics events"
    ON public.analytics_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'super_admin')
        )
    );

-- Index for fast analytics queries
CREATE INDEX idx_analytics_events_name_time ON public.analytics_events (event_name, created_at);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events (user_id);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events (session_id);


-- 2. Add last_verified_at to master data tables

ALTER TABLE public.majors 
    ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

ALTER TABLE public.universities 
    ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- Note: careers already has last_verified_at and status.
-- majors and universities already have status (which acts as verification_status in this context).

