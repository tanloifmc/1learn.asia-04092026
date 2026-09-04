"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { StatusMessage } from "@/components/ui/status-message";
import { registerWithAutoConfirm } from "@/app/(auth)/actions";
import { ArrowRight } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const res = await registerWithAutoConfirm(formData);

    if (!res.success) {
      setMessage(res.error || "Đăng ký thất bại.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Đăng ký thành công! Đang chuyển hướng...");
    router.replace("/onboarding");
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-navy/80 uppercase tracking-wider">Email</label>
        <input 
          name="email" 
          type="email" 
          autoComplete="email" 
          required 
          className="input bg-transparent border-t-0 border-x-0 border-b-2 border-navy/10 rounded-none px-0 py-2.5 text-lg focus-visible:ring-0 focus-visible:border-[#C6A15B] transition-colors w-full outline-none"
          placeholder="email@example.com"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs font-semibold text-navy/80 uppercase tracking-wider">Mật khẩu</label>
        <input 
          name="password" 
          type="password" 
          autoComplete="new-password" 
          required 
          minLength={6}
          className="input bg-transparent border-t-0 border-x-0 border-b-2 border-navy/10 rounded-none px-0 py-2.5 text-lg focus-visible:ring-0 focus-visible:border-[#C6A15B] transition-colors w-full outline-none"
          placeholder="Tạo mật khẩu (từ 6 ký tự)"
        />
      </div>

      {message && <div className="mt-1"><StatusMessage tone={message.includes("thành công") ? "success" : "error"}>{message}</StatusMessage></div>}
      
      <div className="mt-6 flex flex-col gap-5">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="btn btn--primary btn--lg w-full flex justify-between items-center px-8 py-4 bg-navy text-white hover:bg-[#0a142e] border-none rounded-full"
        >
          {isSubmitting ? "Đang xử lý..." : "Tạo tài khoản"}
          <ArrowRight className="w-5 h-5 text-[#C6A15B]" />
        </button>
        
        <p className="text-center text-navy/60 font-medium leading-relaxed text-sm">
          Đã có tài khoản? <Link href="/login" className="text-navy hover:text-[#C6A15B] transition-colors border-b border-navy/20 hover:border-[#C6A15B] pb-0.5 ml-1">Đăng nhập</Link>
          <br/>
          <span className="text-xs text-navy/40 mt-3 block">Bằng việc tạo tài khoản, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của 1learn.</span>
        </p>
      </div>
    </form>
  );
}
