import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasValidSePaySignature } from "@/lib/billing/sepay";
import { writeAuditLog } from "@/lib/audit/log";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { rateLimit, requestIp } from "@/lib/security/rate-limit";

const sePayPayloadSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String), gateway: z.string().optional().nullable(),
  transactionDate: z.string().optional().nullable(), accountNumber: z.string().optional().nullable(),
  code: z.string().optional().nullable(), content: z.string().optional().nullable(),
  transferType: z.string(), transferAmount: z.coerce.number().int().positive(), referenceCode: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const limited = rateLimit(`sepay-webhook:${requestIp(request)}`, 60, 60 * 1000);
  if (limited) return limited;
  const rawBody = await request.text();
  if (!hasValidSePaySignature(rawBody, request.headers.get("x-sepay-signature"))) {
    return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 401 });
  }
  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 422 });
  }
  const parsed = sePayPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid webhook payload" }, { status: 422 });

  const payload = parsed.data;
  const admin = createAdminClient();
  const { error: transactionError } = await admin.from("sepay_transactions").insert({
    sepay_transaction_id: payload.id, gateway: payload.gateway, transaction_date: payload.transactionDate,
    account_number: payload.accountNumber, transfer_type: payload.transferType, transfer_amount: payload.transferAmount,
    reference_code: payload.referenceCode, content: payload.content, raw_payload: payload,
  });
  if (transactionError?.code === "23505") return NextResponse.json({ success: true, duplicate: true });
  if (transactionError) return NextResponse.json({ success: false, error: "Unable to record transaction" }, { status: 500 });
  if (payload.transferType.toLowerCase() !== "in" || !payload.code) return NextResponse.json({ success: true, processed: false });

  const { data: intent } = await admin.from("payment_intents").select("id, user_id, plan_id, amount_vnd, expires_at, status").eq("payment_reference", payload.code).eq("status", "pending").maybeSingle();
  if (!intent || intent.amount_vnd !== payload.transferAmount || new Date(intent.expires_at) < new Date()) return NextResponse.json({ success: true, processed: false });

  const { data: confirmedIntent } = await admin.from("payment_intents").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", intent.id).eq("status", "pending").select("id").maybeSingle();
  if (!confirmedIntent) return NextResponse.json({ success: true, processed: false });

  await admin.from("sepay_transactions").update({ matched_payment_intent_id: intent.id }).eq("sepay_transaction_id", payload.id);
  const { data: plan } = await admin.from("membership_plans").select("duration_days").eq("id", intent.plan_id).maybeSingle();
  if (!plan?.duration_days) return NextResponse.json({ success: false, error: "Plan duration missing" }, { status: 500 });
  const now = new Date();
  const { data: current } = await admin.from("membership_subscriptions").select("id, ends_at").eq("user_id", intent.user_id).eq("is_active", true).order("ends_at", { ascending: false }).limit(1).maybeSingle();
  const startsAt = current && new Date(current.ends_at) > now ? new Date(current.ends_at) : now;
  const endsAt = new Date(startsAt.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
  if (current) await admin.from("membership_subscriptions").update({ ends_at: endsAt.toISOString() }).eq("id", current.id);
  else await admin.from("membership_subscriptions").insert({ user_id: intent.user_id, plan_id: intent.plan_id, starts_at: now.toISOString(), ends_at: endsAt.toISOString(), is_active: true });
  await admin.from("notifications").insert({ recipient_user_id: intent.user_id, type: "billing", title: "Thanh vien da duoc kich hoat", body: "Thanh toan SePay cua ban da duoc xac nhan.", action_url: "/membership" });
  await writeAuditLog({ action: "payment_intent.confirmed", entityType: "payment_intent", entityId: intent.id, metadata: { sepayTransactionId: payload.id, amountVnd: payload.transferAmount } }).catch(() => undefined);
  const { data: userResult } = await admin.auth.admin.getUserById(intent.user_id);
  if (userResult.user?.email) await sendTransactionalEmail({ to: userResult.user.email, subject: "Thanh vien da duoc kich hoat", text: "Thanh toan SePay cua ban da duoc xac nhan. Goi thanh vien da duoc kich hoat.", html: "<p>Thanh toan SePay cua ban da duoc xac nhan.</p><p>Goi thanh vien da duoc kich hoat.</p>", idempotencyKey: `payment-intent:${intent.id}:confirmed` }).catch(() => undefined);
  return NextResponse.json({ success: true, processed: true });
}
