"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const { error } = await createClient().auth.updateUser({ password: String(formData.get("password")) });
    setMessage(error ? error.message : "Mat khau da duoc cap nhat. Ban co the dang nhap lai.");
    setIsSubmitting(false);
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label>Mat khau moi<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      {message ? <p className="form-message" role="status">{message}</p> : null}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Dang cap nhat..." : "Cap nhat mat khau"}</button>
    </form>
  );
}
