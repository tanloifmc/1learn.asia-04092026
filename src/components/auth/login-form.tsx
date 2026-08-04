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
    <form className="form-stack" onSubmit={handleSubmit}>
      <FormField label="Email"><input name="email" type="email" autoComplete="email" required /></FormField>
      <FormField label="Mat khau"><input name="password" type="password" autoComplete="current-password" required /></FormField>
      {message ? <StatusMessage tone="error">{message}</StatusMessage> : null}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Dang dang nhap..." : "Dang nhap"}</Button>
      <p><Link href="/forgot-password">Quen mat khau?</Link></p>
      <p>Chua co tai khoan? <Link href="/register">Dang ky</Link></p>
    </form>
  );
}
