import { requireAdministrator } from "@/lib/auth/authorization";
import { UserManagement } from "@/components/admin/user-management";
export default async function AdminUsersPage() { const account = await requireAdministrator(); return <main className="stack"><p className="eyebrow">Quan tri</p><h1>Nguoi dung va vai tro</h1><UserManagement canManageAdministrators={account.roles.includes("super_admin")} currentUserId={account.userId} /></main>; }
