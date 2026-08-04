import { NextResponse } from "next/server";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  if (!(await getAdministratorForApi())) return forbiddenResponse();
  const admin = createAdminClient();
  const { data, error } = await admin.from("audit_logs").select("id, action, entity_type, entity_id, metadata, created_at, actor_user_id").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "Unable to load audit logs" }, { status: 500 });
  return NextResponse.json({ auditLogs: data });
}
