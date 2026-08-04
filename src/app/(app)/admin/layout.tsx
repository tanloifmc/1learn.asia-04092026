import type { ReactNode } from "react";
import { requireContentManager } from "@/lib/auth/authorization";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireContentManager();
  return children;
}
