import Link from "next/link";
import { publicNavigation } from "@/config/navigation";
import { getPublicNavigationSettings } from "@/lib/settings/public-settings";

export async function SiteHeader() {
  const settings = await getPublicNavigationSettings();
  const navigation = settings.headerLinks ?? publicNavigation;
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/">{settings.branding.appName}</Link>
        <nav aria-label="Dieu huong chinh"><ul>{navigation.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul></nav>
        <Link className="button button--primary" href="/login">Dang nhap</Link>
      </div>
    </header>
  );
}
