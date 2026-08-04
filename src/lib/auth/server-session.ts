import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return { supabase, userId: null, email: null };
  }

  return { supabase, userId, email: typeof data.claims.email === "string" ? data.claims.email : null };
}
