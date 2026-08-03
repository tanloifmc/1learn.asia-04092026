"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      options: {
        data: { display_name: String(formData.get("displayName")) },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setMessage(error ? error.message : "Kiem tra email de xac minh tai khoan.");
    setIsSubmitting(false);
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label>Ten hien thi<input name="displayName" autoComplete="name" required /></label>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Mat khau<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      {message ? <p className="form-message" role="status">{message}</p> : null}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Dang tao tai khoan..." : "Tao tai khoan"}</button>
      <p>Da co tai khoan? <Link href="/login">Dang nhap</Link></p>
    </form>
  );
}
