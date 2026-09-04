"use server";

import { createClient } from "@/lib/supabase/server";

export async function bootstrapSuperAdminAction() {
  const supabase = await createClient();

  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user.user) {
    return { success: false, error: "Not authenticated" };
  }

  // Call the RPC we just created in the migration
  const { data, error } = await supabase.rpc("bootstrap_super_admin");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: "Super admin role claimed successfully!" };
}
