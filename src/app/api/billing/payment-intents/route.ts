import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { getSePayInstructions } from "@/lib/billing/sepay";
import { writeAuditLog } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";

const paymentIntentSchema = z.object({ planId: z.string().uuid() });

export async function POST(request: Request) {
  const parsed = paymentIntentSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan" }, { status: 422 });
  const { userId } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const limited = rateLimit(`payment-intent:${userId}`, 5, 10 * 60 * 1000);
  if (limited) return limited;

  const admin = createAdminClient();
  const { data: plan } = await admin.from("membership_plans").select("id, code, name, price_vnd, is_active").eq("id", parsed.data.planId).maybeSingle();
  if (!plan?.is_active) return NextResponse.json({ error: "Plan is unavailable" }, { status: 404 });

  const paymentReference = `CP-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
  const { data: intent, error } = await admin.from("payment_intents").insert({
    user_id: userId,
    plan_id: plan.id,
    amount_vnd: plan.price_vnd,
    payment_reference: paymentReference,
    status: "pending",
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }).select("id, amount_vnd, payment_reference, expires_at, status").single();
  if (error) return NextResponse.json({ error: "Unable to create payment request" }, { status: 500 });
  await writeAuditLog({ actorUserId: userId, action: "payment_intent.created", entityType: "payment_intent", entityId: intent.id, metadata: { planCode: plan.code, amountVnd: intent.amount_vnd } }).catch(() => undefined);

  return NextResponse.json({ paymentIntent: intent, plan: { code: plan.code, name: plan.name }, instructions: getSePayInstructions(paymentReference) }, { status: 201 });
}
