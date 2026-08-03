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
    setMessage(error ? error.message : "Neu email ton tai, huong dan dat lai mat khau da duoc gui.");
    setIsSubmitting(false);
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      {message ? <p className="form-message" role="status">{message}</p> : null}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Dang gui..." : "Gui huong dan"}</button>
      <p><Link href="/login">Quay lai dang nhap</Link></p>
    </form>
  );
}
