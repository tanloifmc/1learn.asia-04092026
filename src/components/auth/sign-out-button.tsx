"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signOut() {
    setIsSubmitting(true);
    await createClient().auth.signOut();
    window.location.assign("/login");
  }

  return <button type="button" onClick={signOut} disabled={isSubmitting}>{isSubmitting ? "Dang dang xuat..." : "Dang xuat"}</button>;
}
