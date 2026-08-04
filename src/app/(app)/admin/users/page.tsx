import { requireAdministrator } from "@/lib/auth/authorization";
import { UserManagement } from "@/components/admin/user-management";
export default async function AdminUsersPage() { await requireAdministrator(); return <main className="stack"><p className="eyebrow">Quan tri</p><h1>Nguoi dung va vai tro</h1><UserManagement /></main>; }
