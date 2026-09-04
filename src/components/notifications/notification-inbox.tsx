"use client";

import { useState } from "react";
import { Bell, Check, Circle, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationInbox({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [updating, setUpdating] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  async function markRead(id: string) {
    setUpdating(id);
    const response = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (response.ok) {
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
    }
    setUpdating(null);
  }

  async function markAllRead() {
    setUpdating("all");
    const response = await fetch("/api/notifications/read-all", { method: "PATCH" });
    if (response.ok) {
      setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
    }
    setUpdating(null);
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bell className="w-10 h-10 text-[#0E1B3D]/20" />
        </div>
        <h2 className="font-serif text-2xl text-[#0E1B3D] mb-4">Bạn chưa có thông báo nào</h2>
        <p className="text-[#0E1B3D]/50 mb-8 max-w-sm mx-auto">
          Các thông báo quan trọng về hệ thống, cập nhật lộ trình hoặc báo cáo sẽ xuất hiện tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0E1B3D]/10 pb-6">
        <h2 className="font-serif text-2xl text-[#0E1B3D]">Tất cả thông báo <span className="text-[#B89862] text-xl ml-1">({unreadCount} chưa đọc)</span></h2>
        
        <button 
          type="button" 
          onClick={markAllRead} 
          disabled={unreadCount === 0 || updating === "all"}
          className="text-sm font-bold text-[#0E1B3D]/50 hover:text-[#0E1B3D] uppercase tracking-wider transition-colors disabled:opacity-30 flex items-center gap-2"
        >
          <Check className="w-4 h-4" /> Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((item) => {
          const isUnread = !item.read_at;
          
          return (
            <article 
              key={item.id} 
              className={`group flex items-start gap-4 p-5 md:p-6 rounded-2xl border transition-all ${
                isUnread 
                  ? 'bg-white border-[#B89862]/30 shadow-md relative overflow-hidden' 
                  : 'bg-[#0E1B3D]/5 border-transparent hover:border-[#0E1B3D]/10'
              }`}
            >
              {/* Unread indicator line */}
              {isUnread && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#B89862]"></div>
              )}

              <button 
                type="button" 
                onClick={() => isUnread && markRead(item.id)}
                disabled={!isUnread || updating === item.id}
                className={`mt-1 flex-shrink-0 transition-colors ${
                  !isUnread ? 'text-[#0E1B3D]/20 cursor-default' : 'text-[#B89862] cursor-pointer hover:text-[#0E1B3D]'
                } ${updating === item.id ? 'opacity-50' : ''}`}
                title={isUnread ? "Đánh dấu đã đọc" : "Đã đọc"}
              >
                {isUnread ? <Circle className="w-6 h-6 fill-[#B89862]/10" /> : <Check className="w-6 h-6" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h3 className={`text-lg font-medium ${isUnread ? 'text-[#0E1B3D]' : 'text-[#0E1B3D]/60'}`}>
                    {item.title}
                  </h3>
                  <span className="text-xs text-[#0E1B3D]/40 whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
                  </span>
                </div>
                
                {item.body && (
                  <p className={`text-sm leading-relaxed mb-3 ${isUnread ? 'text-[#0E1B3D]/80' : 'text-[#0E1B3D]/50'}`}>
                    {item.body}
                  </p>
                )}
                
                {item.action_url && (
                  <Link 
                    href={item.action_url}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#B89862] hover:text-[#0E1B3D] transition-colors uppercase tracking-wider"
                  >
                    Xem chi tiết <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
