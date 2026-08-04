import Link from "next/link";
import { getPublicNavigationSettings } from "@/lib/settings/public-settings";

export async function SiteFooter() {
  const settings = await getPublicNavigationSettings();
  const navigation = settings.footerLinks ?? [{ href: "/contact", label: "Lien he" }, { href: "/pages/privacy", label: "Quyen rieng tu" }, { href: "/pages/terms", label: "Dieu khoan" }];
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="brand">{settings.branding.appName}</p>
        <nav aria-label="Dieu huong chan trang">{navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}{settings.socialLinks.map((item) => <a href={item.href} key={item.href} rel="noreferrer" target="_blank">{item.label}</a>)}</nav>
      </div>
    </footer>
  );
}
