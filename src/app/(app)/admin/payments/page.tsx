import { requireAdministrator } from "@/lib/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin"; // Wait, do they have admin client?
import { createClient } from "@/lib/supabase/server";
import { PaymentList } from "./payment-list";

export default async function AdminPaymentsPage() {
  await requireAdministrator();
  const supabase = await createClient();

  const { data: transactions, error } = await supabase
    .from("payment_transactions")
    .select("*, plan:membership_plans(code, price_amount)")
    .order("created_at", { ascending: false });

  if (error) {
    return <div>Error loading transactions: {error.message}</div>;
  }

  // To display user emails, we might need a workaround since auth.users is not queryable from client.
  // We will let the client component handle display.

  return (
    <main className="stack max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý Thanh toán (Chuyển khoản)</h1>
      <PaymentList initialTransactions={transactions || []} />
    </main>
  );
}
