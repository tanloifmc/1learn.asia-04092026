import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppSidebarWrapper } from "@/components/layouts/app-sidebar-wrapper";

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-background">
      <AppSidebarWrapper>
        <AppSidebar />
      </AppSidebarWrapper>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden md:h-screen">
        {/* We can add a top app header here if needed later */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 lg:p-16">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
