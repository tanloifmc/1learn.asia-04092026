"use client";

import { FormEvent, useState } from "react";
import { User, Phone, Globe, Clock, Save, Loader2 } from "lucide-react";

type ProfileFormProps = {
  displayName: string;
  phone: string;
  locale: string;
  timezone: string;
};

export function ProfileForm({ displayName, phone, locale, timezone }: ProfileFormProps) {
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: formData.get("displayName"),
        phone: formData.get("phone"),
        locale: formData.get("locale"),
        timezone: formData.get("timezone"),
      }),
    });

    if (response.ok) {
      setMessage({ text: "Đã cập nhật hồ sơ thành công.", type: "success" });
    } else {
      setMessage({ text: "Không thể cập nhật hồ sơ. Vui lòng thử lại.", type: "error" });
    }
    setIsSubmitting(false);
  }

  return (
    <form className="bg-white rounded-[24px] p-8 shadow-sm border border-[#0E1B3D]/5 space-y-6" onSubmit={handleSubmit}>
      <h2 className="font-serif text-2xl text-[#0E1B3D] mb-6">Thông tin cá nhân</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0E1B3D]/60 uppercase tracking-wider">Tên hiển thị</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0E1B3D]/40" />
            <input 
              name="displayName" 
              defaultValue={displayName} 
              required 
              className="w-full bg-[#0E1B3D]/5 border-none rounded-xl py-3 pl-12 pr-4 text-[#0E1B3D] focus:ring-2 focus:ring-[#B89862]/50 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0E1B3D]/60 uppercase tracking-wider">Số điện thoại</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0E1B3D]/40" />
            <input 
              name="phone" 
              defaultValue={phone} 
              className="w-full bg-[#0E1B3D]/5 border-none rounded-xl py-3 pl-12 pr-4 text-[#0E1B3D] focus:ring-2 focus:ring-[#B89862]/50 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0E1B3D]/60 uppercase tracking-wider">Ngôn ngữ</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0E1B3D]/40" />
            <select 
              name="locale" 
              defaultValue={locale} 
              required
              className="w-full bg-[#0E1B3D]/5 border-none rounded-xl py-3 pl-12 pr-4 text-[#0E1B3D] focus:ring-2 focus:ring-[#B89862]/50 outline-none transition-all appearance-none"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0E1B3D]/60 uppercase tracking-wider">Múi giờ</label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0E1B3D]/40" />
            <select 
              name="timezone" 
              defaultValue={timezone} 
              required
              className="w-full bg-[#0E1B3D]/5 border-none rounded-xl py-3 pl-12 pr-4 text-[#0E1B3D] focus:ring-2 focus:ring-[#B89862]/50 outline-none transition-all appearance-none"
            >
              <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
            </select>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-[#0E1B3D] text-white rounded-full font-bold hover:bg-[#B89862] hover:text-[#0E1B3D] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
