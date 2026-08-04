import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { writeAuditLog } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/admin";

const roleSchema = z.object({ role: z.enum(["user", "provider", "editor", "admin", "super_admin"]), action: z.enum(["add", "remove"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getAdministratorForApi();
  if (!account) return forbiddenResponse();
  const { id } = await params;
  const parsed = roleSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid role request" }, { status: 422 });
  const { role, action } = parsed.data;
  const isSuperAdmin = account.roles.includes("super_admin");
  if (id === account.userId || (!isSuperAdmin && ["admin", "super_admin"].includes(role))) return forbiddenResponse();
  if (role === "user" && action === "remove") return NextResponse.json({ error: "Base user role cannot be removed" }, { status: 422 });
  const admin = createAdminClient();
  const result = action === "add"
    ? await admin.from("user_roles").upsert({ user_id: id, role, created_by: account.userId }, { onConflict: "user_id,role" })
    : await admin.from("user_roles").delete().eq("user_id", id).eq("role", role);
  if (result.error) return NextResponse.json({ error: "Unable to update role" }, { status: 500 });
  await writeAuditLog({ actorUserId: account.userId, action: `role.${action}`, entityType: "user_role", entityId: id, metadata: { role } });
  return NextResponse.json({ success: true });
}
