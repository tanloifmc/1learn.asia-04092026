"use client";

import { useEffect, useState } from "react";
import { Bell, Save, Loader2 } from "lucide-react";

export function PreferenceForm() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/account/preferences")
      .then(async (response) => {
        if (!response.ok) throw new Error("load");
        return response.json();
      })
      .then(({ preferences }) => {
        if (!active) return;
        setEmailNotifications(preferences.email_notifications);
        setProductUpdates(preferences.product_updates);
      })
      .catch(() => {
        if (active) setMessage({ text: "Không thể tải tùy chọn.", type: "error" });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function save() {
    setIsSaving(true);
    const response = await fetch("/api/account/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailNotifications, productUpdates }),
    });
    if (response.ok) {
      setMessage({ text: "Đã lưu tùy chọn thông báo.", type: "success" });
    } else {
      setMessage({ text: "Không thể lưu tùy chọn.", type: "error" });
    }
    setIsSaving(false);
  }

  return (
    <section className="bg-white rounded-[24px] p-8 shadow-sm border border-[#0E1B3D]/5 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-8 h-8 text-[#0E1B3D]" />
        <h2 className="font-serif text-2xl text-[#0E1B3D]">Thông báo</h2>
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-4 p-4 rounded-xl border border-[#0E1B3D]/10 hover:border-[#B89862]/50 transition-colors cursor-pointer">
          <div className="pt-1">
            <input 
              checked={emailNotifications} 
              disabled={isLoading || isSaving} 
              onChange={(event) => setEmailNotifications(event.target.checked)} 
              type="checkbox"
              className="w-5 h-5 rounded text-[#B89862] focus:ring-[#B89862]"
            />
          </div>
          <div>
            <p className="font-bold text-[#0E1B3D]">Email vận hành</p>
            <p className="text-sm text-[#0E1B3D]/60">Nhận email về trạng thái thanh toán, bảo mật và các cập nhật quan trọng.</p>
          </div>
        </label>

        <label className="flex items-start gap-4 p-4 rounded-xl border border-[#0E1B3D]/10 hover:border-[#B89862]/50 transition-colors cursor-pointer">
          <div className="pt-1">
            <input 
              checked={productUpdates} 
              disabled={isLoading || isSaving} 
              onChange={(event) => setProductUpdates(event.target.checked)} 
              type="checkbox"
              className="w-5 h-5 rounded text-[#B89862] focus:ring-[#B89862]"
            />
          </div>
          <div>
            <p className="font-bold text-[#0E1B3D]">Cập nhật sản phẩm</p>
            <p className="text-sm text-[#0E1B3D]/60">Nhận thông tin về các tính năng mới và chương trình ưu đãi.</p>
          </div>
        </label>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button 
          className="flex items-center gap-2 px-6 py-3 bg-[#0E1B3D] text-white rounded-full font-bold hover:bg-[#B89862] hover:text-[#0E1B3D] transition-colors disabled:opacity-50" 
          disabled={isLoading || isSaving} 
          onClick={save} 
          type="button"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? "Đang lưu..." : "Lưu tùy chọn"}
        </button>
      </div>
    </section>
  );
}
