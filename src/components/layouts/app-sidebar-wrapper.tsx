"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export function AppSidebarWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when pathname changes (e.g. after clicking a link)
  useEffect(() => {
    // eslint-disable-next-line
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-navy/5 sticky top-0 z-40 w-full shrink-0">
        <Link href="/" className="flex items-center">
          <Logo className="text-2xl" />
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 -mr-2 text-navy hover:bg-navy/5 rounded-lg transition-colors"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? "translate-x-0 shadow-2xl md:shadow-none" : "-translate-x-full"}
      `}>
        {/* Added a relative container here so that the sidebar behaves exactly as before when on desktop */}
        <div className="h-full w-72 bg-surface">
          {children}
        </div>
      </div>
    </>
  );
}
