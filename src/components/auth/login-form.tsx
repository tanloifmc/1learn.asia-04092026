"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { StatusMessage } from "@/components/ui/status-message";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label htmlFor="login-email" className="text-xs font-semibold text-navy/80 uppercase tracking-wider">Email</label>
        <input 
          id="login-email"
          name="email" 
          type="email" 
          autoComplete="email" 
          required 
          className="input bg-transparent border-t-0 border-x-0 border-b-2 border-navy/10 rounded-none px-0 py-2.5 text-lg focus-visible:ring-0 focus-visible:border-[#C6A15B] transition-colors w-full outline-none"
          placeholder="email@example.com"
        />
      </div>
      
      <div className="space-y-1">
        <label htmlFor="login-password" className="text-xs font-semibold text-navy/80 uppercase tracking-wider">Mật khẩu</label>
        <input 
          id="login-password"
          name="password" 
          type="password" 
          autoComplete="current-password" 
          required 
          className="input bg-transparent border-t-0 border-x-0 border-b-2 border-navy/10 rounded-none px-0 py-2.5 text-lg focus-visible:ring-0 focus-visible:border-[#C6A15B] transition-colors w-full outline-none"
          placeholder="Nhập mật khẩu"
        />
      </div>

      {message && <div className="mt-1"><StatusMessage tone="error">{message}</StatusMessage></div>}
      
      <div className="mt-6 flex flex-col gap-5">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="btn btn--primary btn--lg w-full flex justify-center items-center px-8 py-4 bg-navy text-white hover:bg-[#0a142e] border-none rounded-full"
        >
          {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
        </button>
        
        <p className="text-center text-navy/60 font-medium leading-relaxed text-sm">
          <Link href="/forgot-password" className="text-navy hover:text-[#C6A15B] transition-colors">Quên mật khẩu?</Link>
          <br/><br/>
          Chưa có tài khoản? <Link href="/register" className="text-navy hover:text-[#C6A15B] transition-colors border-b border-navy/20 hover:border-[#C6A15B] pb-0.5 ml-1">Đăng ký</Link>
        </p>
      </div>
    </form>
  );
}
