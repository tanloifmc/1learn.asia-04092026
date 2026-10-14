import { hasPublicSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export const getCurrentAccount = cache(async () => {
  if (!hasPublicSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) return null;
  const userId = user.id;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url, phone, locale, timezone").eq("id", userId).single(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  return {
    userId,
    email: user.email ?? null,
    profile,
    roles: roles?.map(({ role }) => role) ?? [],
  };
});
