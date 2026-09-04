import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { SiteHeader } from "@/components/layouts/site-header";

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  // We include the SiteHeader (or an App Header version) at the top,
  // and the sidebar next to the content.
  // Wait, if it's an app dashboard, we might not want the public SiteHeader.
  // I will just implement a clean layout.
  
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* We can add a top app header here if needed later */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-16">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
