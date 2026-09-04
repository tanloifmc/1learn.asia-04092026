-- 1. DROP THE OLD ANALYTICS EVENTS TABLE
DROP TABLE IF EXISTS "public"."analytics_events" CASCADE;

-- 2. CREATE NEW ANALYTICS EVENTS TABLE
CREATE TABLE "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_name" "text" NOT NULL,
    "event_version" "text" NOT NULL DEFAULT 'v1',
    "user_id" "uuid",
    "anonymous_id" "text",
    "session_id" "text",
    "source" "text",
    "platform" "text" DEFAULT 'web',
    "properties" "jsonb" DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "referrer" "text",
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- Enable RLS on analytics_events
ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;

-- Analytics events can only be inserted by Service Role (server-side)
-- There are NO policies allowing anon or authenticated users to insert directly.
-- Client must use the /api/analytics endpoint.
CREATE POLICY "Enable read for service role only" ON "public"."analytics_events"
    AS PERMISSIVE FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "Enable insert for service role only" ON "public"."analytics_events"
    AS PERMISSIVE FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Indexes for querying analytics
CREATE INDEX idx_analytics_events_name ON "public"."analytics_events" USING btree ("event_name");
CREATE INDEX idx_analytics_events_created_at ON "public"."analytics_events" USING btree ("created_at");
CREATE INDEX idx_analytics_events_user_id ON "public"."analytics_events" USING btree ("user_id");

-- 3. UPDATE MASTER DATA TABLES (careers, majors, universities)

-- CAREERS
ALTER TABLE "public"."careers" RENAME COLUMN "status" TO "editorial_status";
ALTER TABLE "public"."careers" ADD COLUMN "verification_status" "text" DEFAULT 'unverified' NOT NULL;
-- (last_verified_at already exists from previous migration)

-- MAJORS
ALTER TABLE "public"."majors" RENAME COLUMN "status" TO "editorial_status";
ALTER TABLE "public"."majors" ADD COLUMN "verification_status" "text" DEFAULT 'unverified' NOT NULL;

-- UNIVERSITIES
ALTER TABLE "public"."universities" RENAME COLUMN "status" TO "editorial_status";
ALTER TABLE "public"."universities" ADD COLUMN "verification_status" "text" DEFAULT 'unverified' NOT NULL;
