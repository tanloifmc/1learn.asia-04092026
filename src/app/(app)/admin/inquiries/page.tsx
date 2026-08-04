import { InquiryOverview } from "@/components/admin/inquiry-overview";
import { requireAdministrator } from "@/lib/auth/authorization";
export default async function AdminInquiriesPage() { await requireAdministrator(); return <main className="stack"><p className="eyebrow">Quan tri</p><h1>Yeu cau lien he</h1><InquiryOverview /></main>; }
