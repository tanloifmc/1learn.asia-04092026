"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const { error } = await createClient().auth.resetPasswordForEmail(String(formData.get("email")), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setMessage(error ? error.message : "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.");
    setIsSubmitting(false);
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

      {message && <div className="mt-1"><p className={`text-sm ${message.includes("Nếu email") ? "text-green-600" : "text-red-600"}`}>{message}</p></div>}
      
      <div className="mt-6 flex flex-col gap-5">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="btn btn--primary btn--lg w-full flex justify-between items-center px-8 py-4 bg-navy text-white hover:bg-[#0a142e] border-none rounded-full"
        >
          {isSubmitting ? "Đang gửi..." : "Gửi hướng dẫn"}
          <span className="w-5 h-5 flex items-center justify-center text-[#C6A15B]">→</span>
        </button>
        
        <p className="text-center text-navy/60 font-medium text-sm">
          <Link href="/login" className="text-navy hover:text-[#C6A15B] transition-colors border-b border-navy/20 hover:border-[#C6A15B] pb-0.5">Quay lại đăng nhập</Link>
        </p>
      </div>
    </form>
  );
}
