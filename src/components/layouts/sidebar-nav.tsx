"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

type SidebarNavProps = {
  navigation: NavItem[];
  title: string;
};

export function SidebarNav({ navigation, title }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-4" aria-label={title}>
      <ul className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link 
                href={item.href}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-navy text-white shadow-md shadow-navy/10" 
                    : "text-navy/60 hover:bg-soft-blue hover:text-navy"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
