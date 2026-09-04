import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { getPublicNavigationSettings } from "@/features/settings/public-settings";

export async function SiteFooter() {
  const settings = await getPublicNavigationSettings();
  const navigation = settings.footerLinks ?? [{ href: "/contact", label: "Liên hệ" }, { href: "/pages/privacy", label: "Quyền riêng tư" }, { href: "/pages/terms", label: "Điều khoản" }];
  return (
    <footer className="w-full border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
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

        {/* Contact & Zalo CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-border/50">
          <a
            href="tel:0918731411"
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
          >
            <span className="text-base">📞</span>
            <span>Liên hệ: <strong>0918 731 411</strong></span>
          </a>
          <span className="hidden sm:block text-border">•</span>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdr-bx1sQHxvUUBAYij_H72T4bSoxGp_TRbo4gTHg8icQsdOw/viewform?usp=publish-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0068FF] text-white text-sm font-bold hover:bg-[#0055CC] transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <span className="text-white font-black text-base leading-none">Z</span>
            Đăng ký tham gia Group Zalo
          </a>
        </div>
      </div>
    </footer>
  );
}
