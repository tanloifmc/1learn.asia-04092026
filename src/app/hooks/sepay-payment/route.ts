import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-sepay-signature");
    const timestamp = request.headers.get("x-sepay-timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json({ success: false, message: "Missing headers" }, { status: 401 });
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
      return NextResponse.json({ success: false, message: "Request expired" }, { status: 401 });
    }

    const secret = process.env.SEPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("Missing SEPAY_WEBHOOK_SECRET");
      return NextResponse.json({ success: false, message: "Server misconfiguration" }, { status: 500 });
    }

    // Get raw body as text
    const rawBody = await request.text();

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${timestamp}.${rawBody}`);
    const expectedSignature = `sha256=${hmac.digest("hex")}`;

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // 1. Validate minimal payload
    const requiredFields = ["id", "transferAmount", "transferType", "accountNumber", "content"];
    for (const field of requiredFields) {
      if (payload[field] === undefined) {
        return NextResponse.json({ success: false, message: `Missing field: ${field}` }, { status: 200 });
      }
    }

    // Only process incoming transfers
    if (payload.transferType !== "in") {
      return NextResponse.json({ success: true, message: "Ignored outgoing transfer" }, { status: 200 });
    }

    const transferAmount = Number(payload.transferAmount);
    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid transferAmount" }, { status: 200 });
    }

    // Find the transaction_code inside the content
    // Content might be something like "PAYMENT FOR 1L-A8X9K"
    const content = payload.content as string;
    const match = content.match(/1L-[A-Z0-9]+/i);

    if (!match) {
      // Return 200 so SePay doesn't retry, but log it as unmapped.
      console.log(`[SePay Webhook] Unmapped transfer: ${content}`);
      return NextResponse.json({ success: true, message: "No transaction code found" }, { status: 200 });
    }

    const transactionCode = match[0].toUpperCase();

    // Init Supabase Service Role client to bypass RLS for webhook
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the pending transaction
    const { data: tx, error: txErr } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("transaction_code", transactionCode)
      .eq("status", "pending")
      .single();

    if (txErr || !tx) {
      console.log(`[SePay Webhook] Transaction ${transactionCode} not found or already processed`);
      return NextResponse.json({ success: true, message: "Transaction not found or already processed" }, { status: 200 });
    }

    // Verify amount
    if (transferAmount < tx.amount) {
      console.log(`[SePay Webhook] Partial payment for ${transactionCode}: expected ${tx.amount}, got ${transferAmount}`);
      // Mark as rejected due to insufficient amount? Or leave pending. Let's leave pending.
      return NextResponse.json({ success: true, message: "Insufficient amount" }, { status: 200 });
    }

    // Process payment: update transaction status to completed
    const { error: updateErr } = await supabase
      .from("payment_transactions")
      .update({ status: "completed" })
      .eq("id", tx.id);

    if (updateErr) {
      console.error(`[SePay Webhook] Error updating tx ${tx.id}`, updateErr);
      return NextResponse.json({ success: false, message: "Database error" }, { status: 500 });
    }

    // Activate membership plan
    const { data: plan } = await supabase
      .from("membership_plans")
      .select("duration_days")
      .eq("id", tx.plan_id)
      .single();

    const durationDays = plan?.duration_days || 365; // fallback
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(startsAt.getDate() + durationDays);

    const { error: subErr } = await supabase
      .from("membership_subscriptions")
      .insert({
        user_id: tx.user_id,
        plan_id: tx.plan_id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        is_active: true
      });

    if (subErr) {
      console.error(`[SePay Webhook] Error creating subscription for user ${tx.user_id}`, subErr);
    } else {
      console.log(`[SePay Webhook] Successfully activated premium for user ${tx.user_id}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SePay webhook error:", err);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
