"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { LogOut, Loader2 } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signOut() {
    setIsSubmitting(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button 
      type="button" 
      onClick={signOut} 
      disabled={isSubmitting}
      className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-full font-bold transition-colors disabled:opacity-50"
    >
      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
      {isSubmitting ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
}
