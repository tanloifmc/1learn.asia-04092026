import { NextResponse } from "next/server";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  if (!(await getAdministratorForApi())) return forbiddenResponse();
  const admin = createAdminClient();
  const { data, error } = await admin.from("organizations").select("id, name, slug, status, contact_email, created_at, owner_id").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load providers" }, { status: 500 });
  return NextResponse.json({ providers: data });
}
