import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { trackToAdapters } from "@/lib/analytics/adapter";
import { BehavioralEvent, BaseAnalyticsPayload } from "@/lib/analytics/registry";
import { cookies } from "next/headers";

const ALLOWED_BEHAVIORAL_EVENTS = [
  'PAGE_VIEW',
  'CAREER_EXPLORED',
  'MAJOR_EXPLORED',
  'UNIVERSITY_EXPLORED',
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_name, properties, anonymous_id, session_id, url } = body;

    // 1. Validate Event Name
    if (!ALLOWED_BEHAVIORAL_EVENTS.includes(event_name)) {
      return NextResponse.json(
        { error: `Event ${event_name} is not a valid behavioral event or is not allowed from client.` },
        { status: 400 }
      );
    }

    // 2. Rate Limiting (Đơn giản: Có thể triển khai Redis/Upstash sau. Tạm thời chặn nếu spam liên tục)
    // TODO: Implement rate limiting

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
      properties: properties || {},
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
