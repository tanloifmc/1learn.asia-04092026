import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layouts/site-header";
import { SiteFooter } from "@/components/layouts/site-footer";
import { BackToTop } from "@/components/layouts/back-to-top";

const fontSans = Manrope({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const fontSerif = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "1learn.asia - Hiểu mình. Chọn đúng hướng.",
  description: "Nền tảng hướng nghiệp thông minh, giúp học sinh trung học phổ thông tự tin đưa ra quyết định dựa trên dữ liệu thực tế về bản thân.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${fontSans.variable} ${fontSerif.variable} font-sans antialiased bg-background text-navy min-h-screen flex flex-col selection:bg-gold/30 selection:text-navy`}>
        <SiteHeader />
        <main className="flex-1">
          {children}
        </main>
        <BackToTop />
        <SiteFooter />
      </body>
    </html>
  );
}
