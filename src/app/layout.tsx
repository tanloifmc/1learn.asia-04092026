import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layouts/site-footer";
import { SiteHeader } from "@/components/layouts/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Application Core Platform",
  description: "Reusable foundation for a modern multi-role application.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body><SiteHeader />{children}<SiteFooter /></body>
    </html>
  );
}
