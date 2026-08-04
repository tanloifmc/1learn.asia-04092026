import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layouts/app-sidebar";

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  return <div className="app-frame"><AppSidebar /><div className="app-content">{children}</div></div>;
}
