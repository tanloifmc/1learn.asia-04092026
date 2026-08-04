import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  const payload = await request.text();
  let event: { type: string; data?: { email_id?: string; to?: string[] } };
  try {
    event = await new Resend().webhooks.verify({ payload, webhookSecret: secret, headers: { id: request.headers.get("svix-id") ?? "", timestamp: request.headers.get("svix-timestamp") ?? "", signature: request.headers.get("svix-signature") ?? "" } }) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }
  const eventType = event.type.replace("email.", "");
  if (!["sent", "delivered", "bounced", "complained", "failed"].includes(eventType) || !event.data?.email_id) return NextResponse.json({ received: true });
  const admin = createAdminClient();
  const { error } = await admin.from("email_events").upsert({ provider_event_id: `${event.data.email_id}:${eventType}`, type: eventType, recipient_email: event.data.to?.[0] ?? "unknown", payload: event }, { onConflict: "provider_event_id" });
  if (error) return NextResponse.json({ error: "Unable to record email event" }, { status: 500 });
  return NextResponse.json({ received: true });
}
