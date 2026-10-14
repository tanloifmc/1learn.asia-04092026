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

    const requestTimestamp = Number(timestamp);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isSafeInteger(requestTimestamp) || Math.abs(now - requestTimestamp) > 300) {
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

    const content = String(payload.content);
    const match = content.match(/1L-[A-Z0-9]{6,32}/i);

    if (!match) {
      // Return 200 so SePay doesn't retry, but log it as unmapped.
      console.log(`[SePay Webhook] Unmapped transfer: ${content}`);
      return NextResponse.json({ success: true, message: "No transaction code found" }, { status: 200 });
    }

    const transactionCode = match[0].toUpperCase();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase server credentials for SePay webhook");
      return NextResponse.json({ success: false, message: "Server misconfiguration" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await (supabase as any).rpc("process_sepay_membership_payment", {
      p_provider_transaction_id: String(payload.id),
      p_transaction_code: transactionCode,
      p_transfer_amount: transferAmount,
      p_account_number: String(payload.accountNumber),
      p_content: content,
      p_provider_payload: payload,
      p_received_at: new Date().toISOString(),
    });

    if (error) {
      console.error(`[SePay Webhook] Settlement failed for ${transactionCode}`, error);
      return NextResponse.json({ success: false, message: "Database error" }, { status: 500 });
    }

    const outcome = Array.isArray(data) ? data[0]?.outcome : data?.outcome;
    console.log(`[SePay Webhook] ${transactionCode}: ${outcome ?? "unknown"}`);
    return NextResponse.json({ success: true, outcome: outcome ?? "unknown" });
  } catch (err) {
    console.error("SePay webhook error:", err);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
