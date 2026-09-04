"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import crypto from "crypto";

export async function getOrCreatePendingTransaction() {
  const account = await getCurrentAccount();
  if (!account) {
    return { success: false, error: "Not logged in" };
  }

  const supabase = await createClient();

  // Get the premium plan
  const { data: plan, error: planErr } = await supabase
    .from("membership_plans")
    .select("id, price_amount")
    .eq("code", "PREMIUM_1Y")
    .limit(1)
    .single();

  if (planErr || !plan) {
    return { success: false, error: "Premium plan not found" };
  }

  // Check if there is an existing pending transaction
  const { data: existingTx, error: existingErr } = await supabase
    .from("payment_transactions")
    .select("transaction_code, amount")
    .eq("user_id", account.userId)
    .eq("plan_id", plan.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingTx && !existingErr) {
    return { success: true, transactionCode: existingTx.transaction_code, amount: existingTx.amount };
  }

  // Generate a random 6-character alphanumeric code
  const codeSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const transactionCode = `1L-${codeSuffix}`;

  // Create payment transaction
  const { error: txErr } = await supabase
    .from("payment_transactions")
    .insert({
      user_id: account.userId,
      amount: plan.price_amount,
      plan_id: plan.id,
      status: "pending",
      method: "bank_transfer",
      transaction_code: transactionCode
    });

  if (txErr) {
    return { success: false, error: txErr.message };
  }

  return { success: true, transactionCode, amount: plan.price_amount };
}
