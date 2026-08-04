import Link from "next/link";
import { accountNavigation, adminNavigation } from "@/config/navigation";
import { getCurrentAccount } from "@/lib/auth/current-account";

export async function AppSidebar() {
  const account = await getCurrentAccount();
  const canManageContent = account?.roles.some((role) => ["editor", "admin", "super_admin"].includes(role));

  return (
    <aside className="app-sidebar">
      <p className="eyebrow">Tai khoan</p>
      <nav aria-label="Tai khoan"><ul>{accountNavigation.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul></nav>
      {canManageContent ? <><p className="eyebrow app-sidebar__section">Quan tri</p><nav aria-label="Quan tri"><ul>{adminNavigation.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul></nav></> : null}
    </aside>
  );
}
