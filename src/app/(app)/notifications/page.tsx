import { redirect } from "next/navigation";
import { NotificationInbox } from "@/components/notifications/notification-inbox";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) redirect("/login");

  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, action_url, read_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-24">
      {/* HEADER SECTION */}
      <div className="bg-[#0E1B3D] pt-32 pb-48 rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#B89862]/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-4 bg-white/5 backdrop-blur-md">
            <Bell className="w-4 h-4" /> Updates
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-6">Thông báo</h1>
          <p className="text-white/60 text-lg max-w-xl leading-relaxed font-light">
            Cập nhật các thông tin mới nhất về lộ trình, kết quả bài kiểm tra và các gợi ý dành riêng cho bạn.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-32 relative z-20">
        <div className="bg-white rounded-[40px] p-6 md:p-10 shadow-[0_20px_50px_rgba(14,27,61,0.03)] border border-[#0E1B3D]/10 min-h-[500px]">
          <NotificationInbox initialNotifications={data ?? []} />
        </div>
      </div>
    </div>
  );
}
