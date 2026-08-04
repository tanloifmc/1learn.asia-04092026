import { BillingManager } from "@/components/admin/billing-manager";
import { requireAdministrator } from "@/lib/auth/authorization";
export default async function BillingPage() { await requireAdministrator(); return <main className="stack"><p className="eyebrow">Quan tri</p><h1>Goi thanh vien va thanh toan</h1><BillingManager /></main>; }
