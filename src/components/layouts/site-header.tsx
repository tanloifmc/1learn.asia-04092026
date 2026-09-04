"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [session, setSession] = useState<any>(null);

  const appRoutes = [
    "/dashboard", "/account", "/notifications", "/favorites", 
    "/membership", "/home", "/me", "/goal", "/journey", 
    "/parent", "/admin", "/inquiries", "/provider",
    "/onboarding", "/me/kham-pha"
  ];
  const isAppRoute = appRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    
    // Also fetch auth session
    const fetchSession = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    void fetchSession();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isAppRoute) {
    return null;
  }

  const navigation = [
    { href: "/", label: "Trang chủ" },
    { href: "/gioi-thieu", label: "Giới thiệu" },
    { href: "/explore", label: "Khám phá nghề nghiệp" },
    { href: "/me/kham-pha", label: "Trắc nghiệm" },
    { href: "/blog", label: "Cẩm nang" },
  ];

  const isTransparent = (isHome || pathname === "/gioi-thieu" || pathname === "/blog" || pathname === "/explore") && !isScrolled;

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${
      isTransparent 
        ? "bg-transparent border-transparent py-2" 
        : "bg-white/95 backdrop-blur-md py-0 shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
    }`}>
      <div className="container mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Left Side: Logo + Tagline + Nav */}
        <div className="flex items-center gap-12">
          <Link href="/" className="flex flex-col">
            <Logo className="text-3xl" isTransparent={isTransparent} />
            <span className={`hidden sm:block text-[10px] font-medium tracking-wide uppercase mt-1 transition-colors ${
              isTransparent ? "text-white/80" : "text-navy/60"
            }`}>Hiểu mình. Chọn đúng hướng.</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors relative py-2 ${
                  isTransparent 
                    ? (pathname === item.href ? "text-white" : "text-white/70 hover:text-white")
                    : (pathname === item.href ? "text-navy" : "text-navy/60 hover:text-navy")
                }`}
              >
                {item.label}
                {pathname === item.href && (
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full ${
                    isTransparent ? "bg-white" : "bg-navy"
                  }`} />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Side: Auth */}
        <div className="flex items-center gap-6">
          {!session ? (
            <>
              <Link href="/login" className={`hidden md:block text-sm font-medium transition-colors ${
                isTransparent ? "text-white/80 hover:text-white" : "text-navy/70 hover:text-navy"
              }`}>
                Đăng nhập
              </Link>
              <Link href="/login" className={`px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm rounded-lg font-semibold tracking-wide shadow-sm hover:shadow-md transition-all ${
                isTransparent 
                  ? "bg-[#C6A15B] text-white hover:bg-[#B38F4D]" 
                  : "bg-[#0E1B3D] text-white hover:bg-[#1a2c5b]"
              }`}>
                Bắt đầu khám phá
              </Link>
            </>
          ) : (
            <Link href="/dashboard" className={`px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm rounded-lg font-semibold tracking-wide shadow-sm hover:shadow-md transition-all ${
              isTransparent 
                ? "bg-[#C6A15B] text-white hover:bg-[#B38F4D]" 
                : "bg-[#0E1B3D] text-white hover:bg-[#1a2c5b]"
            }`}>
              Vào ứng dụng
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
