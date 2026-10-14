"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";

export async function getOrCreatePendingTransaction() {
  const account = await getCurrentAccount();
  if (!account) {
    return { success: false, error: "Not logged in" };
  }

  const supabase = await createClient();

  const { data, error } = await (supabase as any).rpc("create_pending_membership_payment", {
    p_plan_code: "PREMIUM_1Y",
  });

  const payment = Array.isArray(data) ? data[0] : data;
  if (error || !payment?.transaction_code || payment.amount === undefined) {
    return { success: false, error: error?.message ?? "Không thể tạo giao dịch thanh toán." };
  }

  return {
    success: true,
    transactionCode: payment.transaction_code as string,
    amount: Number(payment.amount),
  };
}
