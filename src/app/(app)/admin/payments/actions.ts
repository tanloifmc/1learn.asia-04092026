"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdministrator } from "@/lib/auth/authorization";

export async function approvePayment(transactionId: string) {
  const account = await requireAdministrator();
  if (!account) throw new Error("Unauthorized");

  const supabase = await createClient();

  // 1. Get the transaction
  const { data: tx, error: txErr } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("id", transactionId)
    .single();

  if (txErr || !tx) throw new Error("Transaction not found");
  if (tx.status !== "pending") throw new Error("Transaction is not pending");

  // 2. Get the plan to know duration
  const { data: plan, error: planErr } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("id", tx.plan_id)
    .single();
    
  if (planErr || !plan) throw new Error("Plan not found");

  // 3. Update transaction
  const { error: updateErr } = await supabase
    .from("payment_transactions")
    .update({ status: "completed" })
    .eq("id", transactionId);

  if (updateErr) throw new Error("Failed to update transaction");

  // 4. Create membership subscription
  const now = new Date();
  const endsAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

  const { error: subErr } = await supabase
    .from("membership_subscriptions")
    .insert({
      user_id: tx.user_id,
      plan_id: plan.id,
      is_active: true,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    });

  if (subErr) throw new Error("Failed to create subscription: " + subErr.message);

  return { success: true };
}

export async function rejectPayment(transactionId: string) {
  const account = await requireAdministrator();
  if (!account) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_transactions")
    .update({ status: "rejected" })
    .eq("id", transactionId);

  if (error) throw new Error(error.message);

  return { success: true };
}
