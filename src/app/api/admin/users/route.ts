import { NextResponse } from "next/server";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  if (!(await getAdministratorForApi())) return forbiddenResponse();
  const admin = createAdminClient();
  const { data: profiles, error: profilesError } = await admin.from("profiles").select("id, display_name, phone, locale, timezone, created_at").order("created_at", { ascending: false }).limit(100);
  if (profilesError) return NextResponse.json({ error: "Unable to load users" }, { status: 500 });

  const userIds = profiles.map(({ id }) => id);
  const { data: roles, error: rolesError } = userIds.length
    ? await admin.from("user_roles").select("user_id, role").in("user_id", userIds)
    : { data: [], error: null };
  if (rolesError) return NextResponse.json({ error: "Unable to load user roles" }, { status: 500 });

  return NextResponse.json({
    users: profiles.map((profile) => ({
      ...profile,
      user_roles: roles.filter((role) => role.user_id === profile.id).map(({ role }) => ({ role })),
    })),
  });
}
