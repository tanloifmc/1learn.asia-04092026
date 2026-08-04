import { SupportRequestOverview } from "@/components/admin/support-request-overview";
import { requireAdministrator } from "@/lib/auth/authorization";

export default async function AdminSupportPage() {
  await requireAdministrator();
  return <main className="stack"><p className="eyebrow">Quan tri</p><h1>Yeu cau ho tro</h1><SupportRequestOverview /></main>;
}
