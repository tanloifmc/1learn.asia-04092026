import { NotificationBroadcastForm } from "@/components/admin/notification-broadcast-form";
import { requireAdministrator } from "@/lib/auth/authorization";
export default async function AdminNotificationsPage() { await requireAdministrator(); return <main className="stack"><p className="eyebrow">Quan tri</p><h1>Thong bao he thong</h1><NotificationBroadcastForm /></main>; }
