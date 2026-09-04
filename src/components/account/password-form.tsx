"use client";
import { useState } from "react";
import { Lock, Save, Loader2 } from "lucide-react";

export function PasswordForm() {
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function change(formData: FormData) {
    setIsSubmitting(true);
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirmPassword"));
    
    if (password !== confirmPassword) {
      setMessage({ text: "Xác nhận mật khẩu chưa khớp.", type: "error" });
      setIsSubmitting(false);
      return;
    }
    
    const response = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    
    if (response.ok) {
      setMessage({ text: "Đã cập nhật mật khẩu thành công.", type: "success" });
    } else {
      setMessage({ text: "Không thể cập nhật mật khẩu. Vui lòng thử lại.", type: "error" });
    }
    setIsSubmitting(false);
  }

  return (
    <form action={change} className="bg-white rounded-[24px] p-8 shadow-sm border border-[#0E1B3D]/5 space-y-6">
      <h2 className="font-serif text-2xl text-[#0E1B3D] mb-6">Bảo mật</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0E1B3D]/60 uppercase tracking-wider">Mật khẩu mới</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0E1B3D]/40" />
            <input 
              minLength={6} 
              name="password" 
              required 
              type="password" 
              className="w-full bg-[#0E1B3D]/5 border-none rounded-xl py-3 pl-12 pr-4 text-[#0E1B3D] focus:ring-2 focus:ring-[#B89862]/50 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0E1B3D]/60 uppercase tracking-wider">Xác nhận mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0E1B3D]/40" />
            <input 
              minLength={6} 
              name="confirmPassword" 
              required 
              type="password" 
              className="w-full bg-[#0E1B3D]/5 border-none rounded-xl py-3 pl-12 pr-4 text-[#0E1B3D] focus:ring-2 focus:ring-[#B89862]/50 outline-none transition-all"
            />
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
          {isSubmitting ? "Đang lưu..." : "Đổi mật khẩu"}
        </button>
      </div>
    </form>
  );
}
