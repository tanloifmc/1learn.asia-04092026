import { redirect } from "next/navigation";
import { NotificationInbox } from "@/components/notifications/notification-inbox";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

export default async function NotificationsPage() {
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) redirect("/login");

  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, action_url, read_at, created_at")
    .order("created_at", { ascending: false });

  return <main><h1>Thong bao</h1><NotificationInbox initialNotifications={data ?? []} /></main>;
}
