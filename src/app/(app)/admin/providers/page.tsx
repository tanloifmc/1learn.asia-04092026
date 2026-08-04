import { requireAdministrator } from "@/lib/auth/authorization";
import { ProviderModeration } from "@/components/admin/provider-moderation";
export default async function AdminProvidersPage() { await requireAdministrator(); return <main className="stack"><p className="eyebrow">Quan tri</p><h1>Duyet nha cung cap</h1><ProviderModeration /></main>; }
