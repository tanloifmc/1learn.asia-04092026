import { requireAdministrator } from "@/lib/auth/authorization";
import { AuditLogList } from "@/components/admin/audit-log-list";
export default async function AdminAuditPage() { await requireAdministrator(); return <main className="stack"><p className="eyebrow">Quan tri</p><h1>Nhat ky he thong</h1><AuditLogList /></main>; }
