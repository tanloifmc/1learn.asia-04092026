import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { getPublicNavigationSettings } from "@/features/settings/public-settings";

export async function SiteFooter() {
  const settings = await getPublicNavigationSettings();
  const navigation = settings.footerLinks ?? [{ href: "/contact", label: "Liên hệ" }, { href: "/pages/privacy", label: "Quyền riêng tư" }, { href: "/pages/terms", label: "Điều khoản" }];
  return (
    <footer className="w-full border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center">
          <Logo className="text-3xl" />
        </Link>
        <nav aria-label="Điều hướng chân trang" className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm text-text-secondary">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ))}
          {settings.socialLinks.map((item) => (
            <a href={item.href} key={item.href} rel="noreferrer" target="_blank" className="hover:text-primary transition-colors">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
