import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const userId = error ? null : data.user?.id;

  if (!userId) {
    return { supabase, userId: null, email: null };
  }

  return { supabase, userId, email: data.user?.email ?? null };
}
