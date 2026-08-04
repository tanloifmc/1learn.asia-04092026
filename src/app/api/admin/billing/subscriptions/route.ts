import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { writeAuditLog } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ userId: z.string().uuid(), planId: z.string().uuid() });

export async function GET() {
  if (!(await getAdministratorForApi())) return forbiddenResponse();
  const supabase = await createClient();
  const { data, error } = await supabase.from("membership_subscriptions").select("id, user_id, starts_at, ends_at, is_active, created_at, membership_plans(name, code)").order("ends_at", { ascending: false }).limit(200);
  return error ? NextResponse.json({ error: "Unable to load subscriptions" }, { status: 500 }) : NextResponse.json({ subscriptions: data });
}

export async function POST(request: Request) {
  const account = await getAdministratorForApi();
  if (!account) return forbiddenResponse();
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid membership input" }, { status: 422 });
  const supabase = await createClient();
  const { data: plan } = await supabase.from("membership_plans").select("id, duration_days, is_active").eq("id", parsed.data.planId).maybeSingle();
  if (!plan?.is_active) return NextResponse.json({ error: "Plan is unavailable" }, { status: 404 });
  const { data: current } = await supabase.from("membership_subscriptions").select("id, ends_at").eq("user_id", parsed.data.userId).eq("is_active", true).order("ends_at", { ascending: false }).limit(1).maybeSingle();
  const now = new Date();
  const startsAt = current && new Date(current.ends_at) > now ? new Date(current.ends_at) : now;
  const endsAt = new Date(startsAt.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
  const result = current ? await supabase.from("membership_subscriptions").update({ ends_at: endsAt.toISOString() }).eq("id", current.id).select("id, user_id, ends_at").single() : await supabase.from("membership_subscriptions").insert({ user_id: parsed.data.userId, plan_id: plan.id, starts_at: now.toISOString(), ends_at: endsAt.toISOString(), is_active: true }).select("id, user_id, ends_at").single();
  if (result.error) return NextResponse.json({ error: "Unable to activate membership" }, { status: 500 });
  await writeAuditLog({ actorUserId: account.userId, action: "membership_subscription.activated", entityType: "membership_subscription", entityId: result.data.id, metadata: { userId: result.data.user_id, planId: plan.id, endsAt: result.data.ends_at } }).catch(() => undefined);
  return NextResponse.json({ subscription: result.data }, { status: current ? 200 : 201 });
}
