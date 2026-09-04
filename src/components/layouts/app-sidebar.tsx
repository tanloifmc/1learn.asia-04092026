import Link from "next/link";
import { accountNavigation, adminNavigation, studentNavigation, parentNavigation } from "@/config/navigation";
import { getCurrentAccount } from "@/features/account/current-account";
import { SidebarNav } from "./sidebar-nav";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/server";

export async function AppSidebar() {
  const account = await getCurrentAccount();
  const canManageContent = account?.roles.some((role) => ["editor", "admin", "super_admin"].includes(role));
  const isStudent = account?.roles.includes("student");
  const isParent = account?.roles.includes("parent");

  let navigation = studentNavigation;
  let title = "Hành trình của bạn";

  if (isParent) {
    navigation = parentNavigation;
    title = "Đồng hành cùng con";
  } else if (canManageContent && !isStudent) {
    navigation = adminNavigation;
    title = "Quản trị";
  }

  // Fallback info if no account (shouldn't happen in protected routes, but good for type safety)
  const userName = account?.profile?.display_name || account?.email?.split('@')[0] || "User";
  const userInitials = userName.substring(0, 2).toUpperCase();

  let isPremium = false;
  if (account) {
    const supabase = await createClient();
    const today = new Date().toISOString();
    const { data: sub } = await supabase
      .from("membership_subscriptions")
      .select("id")
      .eq("user_id", account.userId)
      .eq("is_active", true)
      .gte("ends_at", today)
      .limit(1)
      .maybeSingle();
    isPremium = !!sub;
  }

  return (
    <aside className="w-72 bg-surface border-r border-navy/5 min-h-screen flex flex-col shrink-0">
      <div className="h-20 px-8 flex items-center border-b border-navy/5">
        <Link href="/" className="flex flex-col">
          <Logo className="text-2xl" />
        </Link>
      </div>

      <div className="p-8 pb-4">
        <p className="text-xs font-bold text-navy/40 uppercase tracking-widest">{title}</p>
      </div>
      
      {/* Client component for active state routing */}
      <SidebarNav navigation={navigation} title={title} />

      {canManageContent && (
        <div className="mt-8 px-4 pb-8">
          <p className="px-4 text-xs font-bold text-navy/40 uppercase tracking-widest mb-4">Quản trị</p>
          <SidebarNav navigation={adminNavigation} title="Quản trị" />
        </div>
      )}
      
      <div className="p-4 mt-auto border-t border-navy/5">
        <Link href="/account" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-soft-blue transition-colors cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-soft-blue group-hover:bg-white flex items-center justify-center font-bold text-navy shrink-0 transition-colors overflow-hidden border border-navy/10">
            {account?.profile?.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={account.profile.avatar_url} alt={userName} className="w-full h-full object-cover" />
            ) : (
              userInitials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-navy truncate">{userName}</p>
              {isPremium && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#B89862] text-white tracking-widest uppercase flex-shrink-0">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs text-navy/50 truncate">Tài khoản & Cài đặt</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
