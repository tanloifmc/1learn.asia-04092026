import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { trackToAdapters } from "@/lib/analytics/adapter";
import { BehavioralEvent, BaseAnalyticsPayload } from "@/lib/analytics/registry";
import { cookies } from "next/headers";
import { rateLimit } from "@/lib/security/rate-limit";
import { z } from "zod";

const ALLOWED_BEHAVIORAL_EVENTS = [
  'PAGE_VIEW',
  'CAREER_EXPLORED',
  'MAJOR_EXPLORED',
  'UNIVERSITY_EXPLORED',
] as const;

const identifierSchema = z.string().trim().min(8).max(128).optional();
const pageViewPropertiesSchema = z.object({
  path: z.string().startsWith("/").max(2048),
  search: z.string().max(2048),
  title: z.string().max(256),
}).strict();
const explorationPropertiesSchema = z.object({
  target_id: z.uuid(),
  slug: z.string().trim().min(1).max(160),
}).strict();
const analyticsRequestSchema = z.object({
  event_name: z.enum(ALLOWED_BEHAVIORAL_EVENTS),
  anonymous_id: identifierSchema,
  session_id: identifierSchema,
  properties: z.union([pageViewPropertiesSchema, explorationPropertiesSchema]),
}).strict();

export async function POST(req: Request) {
  try {
    const body = analyticsRequestSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid analytics event payload." },
        { status: 400 }
      );
    }

    const { event_name, properties, anonymous_id, session_id } = body.data;

    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const rateLimitKey = anonymous_id ?? session_id ?? forwardedFor;
    if (!rateLimitKey) {
      return NextResponse.json({ error: "Analytics identifier is required." }, { status: 400 });
    }
    const rateLimitResponse = rateLimit(`analytics:${rateLimitKey}`, 60, 60_000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 3. Get User Auth
    let user_id = undefined;
    const account = await getCurrentAccount();
    if (account) {
      user_id = account.userId;
    }

    // 4. Lấy marketing attribution từ cookies nếu có
    const cookieStore = await cookies();
    const utm_source = cookieStore.get('1learn_utm_source')?.value;
    const utm_medium = cookieStore.get('1learn_utm_medium')?.value;
    const utm_campaign = cookieStore.get('1learn_utm_campaign')?.value;
    const referrer = cookieStore.get('1learn_referrer')?.value;

    // 5. Construct Payload
    const payload: BaseAnalyticsPayload = {
      event_name: event_name as BehavioralEvent,
      event_version: 'v1',
      user_id,
      anonymous_id,
      session_id,
      source: 'client',
      platform: 'web',
      properties,
      utm_source,
      utm_medium,
      utm_campaign,
      referrer,
    };

    // 6. Push to Adapter
    await trackToAdapters(payload);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Analytics Ingestion] Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
