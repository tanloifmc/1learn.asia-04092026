import { createClient } from "@/lib/supabase/server";

export async function getCurrentAccount() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  const userId = claims?.sub;
  if (!userId) {
    return null;
  }

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url, phone, locale, timezone").eq("id", userId).single(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  return {
    userId,
    email: typeof claims.email === "string" ? claims.email : null,
    profile,
    roles: roles?.map(({ role }) => role) ?? [],
  };
}
