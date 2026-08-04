import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { writeAuditLog } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/admin";

const statusSchema = z.object({ status: z.enum(["approved", "rejected", "suspended"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getAdministratorForApi();
  if (!account) return forbiddenResponse();
  const { id } = await params;
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid provider status" }, { status: 422 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("organizations").update({ status: parsed.data.status }).eq("id", id).select("id, owner_id, name, status").single();
  if (error) return NextResponse.json({ error: "Unable to update provider" }, { status: 500 });
  await Promise.all([
    writeAuditLog({ actorUserId: account.userId, action: "provider.status_updated", entityType: "organization", entityId: data.id, metadata: { status: data.status } }),
    admin.from("notifications").insert({ recipient_user_id: data.owner_id, type: "account", title: "Cap nhat ho so doanh nghiep", body: `Trang thai ${data.name} da duoc cap nhat: ${data.status}.`, action_url: "/provider" }),
  ]);
  return NextResponse.json({ provider: data });
}
