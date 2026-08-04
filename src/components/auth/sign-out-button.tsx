"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signOut() {
    setIsSubmitting(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return <button type="button" onClick={signOut} disabled={isSubmitting}>{isSubmitting ? "Dang dang xuat..." : "Dang xuat"}</button>;
}
