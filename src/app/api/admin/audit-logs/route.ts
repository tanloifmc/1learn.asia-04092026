import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  action: z.string().trim().min(1).max(120).optional(),
  entityType: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export async function GET(request: Request) {
  if (!(await getAdministratorForApi())) return forbiddenResponse();
  const searchParams = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    action: searchParams.get("action") || undefined,
    entityType: searchParams.get("entityType") || undefined,
    limit: searchParams.get("limit") || undefined,
    offset: searchParams.get("offset") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid audit query" }, { status: 422 });

  const admin = createAdminClient();
  const { action, entityType, limit, offset } = parsed.data;
  let query = admin.from("audit_logs").select("id, action, entity_type, entity_id, metadata, created_at, actor_user_id");
  if (action) query = query.eq("action", action);
  if (entityType) query = query.eq("entity_type", entityType);
  const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + limit);
  if (error) return NextResponse.json({ error: "Unable to load audit logs" }, { status: 500 });
  const auditLogs = data ?? [];
  return NextResponse.json({ auditLogs: auditLogs.slice(0, limit), nextOffset: auditLogs.length > limit ? offset + limit : null });
}
