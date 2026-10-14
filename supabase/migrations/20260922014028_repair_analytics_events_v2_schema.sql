-- Repair databases that recorded the V2 migration after its guarded CREATE TABLE
-- path left the pre-existing V1 table unchanged.
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS event_version TEXT,
  ADD COLUMN IF NOT EXISTS anonymous_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT;

UPDATE public.analytics_events
SET
  event_version = COALESCE(event_version, 'v1'),
  platform = COALESCE(platform, 'web'),
  properties = COALESCE(properties, '{}'::jsonb);

ALTER TABLE public.analytics_events
  ALTER COLUMN event_version SET DEFAULT 'v1',
  ALTER COLUMN event_version SET NOT NULL,
  ALTER COLUMN platform SET DEFAULT 'web',
  ALTER COLUMN properties SET DEFAULT '{}'::jsonb,
  ALTER COLUMN properties SET NOT NULL;

-- Browser clients must use the validated server ingestion endpoint. The prior
-- V1 permissive INSERT policy let any caller write arbitrary events directly.
DROP POLICY IF EXISTS "Users can insert analytics events" ON public.analytics_events;

CREATE INDEX IF NOT EXISTS idx_analytics_events_name
  ON public.analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON public.analytics_events (created_at);
