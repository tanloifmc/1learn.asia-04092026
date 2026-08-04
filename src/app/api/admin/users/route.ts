import { NextResponse } from "next/server";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  if (!(await getAdministratorForApi())) return forbiddenResponse();
  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select("id, display_name, phone, locale, timezone, created_at, user_roles(role)").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Unable to load users" }, { status: 500 });
  return NextResponse.json({ users: data });
}
