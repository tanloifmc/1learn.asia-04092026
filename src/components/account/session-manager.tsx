"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonitorSmartphone, LogOut, Loader2, AlertTriangle } from "lucide-react";

export function SessionManager() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    lastSignInAt?: string;
  } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.last_sign_in_at) {
        setSessionInfo({
          lastSignInAt: new Date(session.user.last_sign_in_at).toLocaleString('vi-VN'),
        });
      }
    });
  }, [supabase.auth]);

  async function handleSignOutOthers() {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) {
      setMessage({ text: `Lỗi: ${error.message}`, type: "error" });
    } else {
      setMessage({ text: "Đã đăng xuất khỏi tất cả các thiết bị khác thành công.", type: "success" });
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-[24px] p-8 shadow-sm border border-[#0E1B3D]/5 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MonitorSmartphone className="w-8 h-8 text-[#0E1B3D]" />
        <h2 className="font-serif text-2xl text-[#0E1B3D]">Thiết bị & Đăng nhập</h2>
      </div>

      <div className="bg-soft-blue/20 rounded-xl p-5 border border-soft-blue/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="font-bold text-navy mb-1">Phiên đăng nhập hiện tại</p>
          {sessionInfo?.lastSignInAt && (
            <p className="text-sm text-navy/70">Đăng nhập lần cuối: {sessionInfo.lastSignInAt}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-bold">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          Đang hoạt động
        </div>
      </div>

      <div className="bg-red-50 rounded-xl p-5 border border-red-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900 mb-1">Đăng xuất khỏi thiết bị khác</p>
            <p className="text-sm text-red-800/80 mb-4">
              Nếu bạn phát hiện hoạt động đáng ngờ, hãy đăng xuất khỏi các thiết bị khác để đảm bảo an toàn cho tài khoản.
            </p>
            <button 
              onClick={handleSignOutOthers} 
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-full font-bold transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              {loading ? "Đang xử lý..." : "Đăng xuất thiết bị khác"}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
