import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentAccount } from "@/lib/auth/current-account";

export default async function DashboardPage() {
  const account = await getCurrentAccount();
  if (!account) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Xin chao {account.profile?.display_name || account.email || "ban"}.</p>
      <p>Vai tro: {account.roles.join(", ") || "user"}</p>
      <p><Link href="/account">Quan ly tai khoan</Link></p>
      <p><Link href="/notifications">Thong bao</Link></p>
      <p><Link href="/favorites">Muc da luu</Link></p>
      <SignOutButton />
    </main>
  );
}
