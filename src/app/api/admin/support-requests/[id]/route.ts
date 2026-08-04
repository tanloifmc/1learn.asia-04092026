import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { writeAuditLog } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

const statusSchema = z.object({ status: z.enum(["new", "read", "responded", "closed", "spam"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getAdministratorForApi();
  if (!account) return forbiddenResponse();
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid support request status" }, { status: 422 });
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("support_requests").update({ status: parsed.data.status, handled_by: account.userId }).eq("id", id).select("id, sender_user_id, subject, status").single();
  if (error) return NextResponse.json({ error: "Unable to update support request" }, { status: 500 });
  await writeAuditLog({ actorUserId: account.userId, action: "support_request.status_updated", entityType: "support_request", entityId: data.id, metadata: { status: data.status } }).catch(() => undefined);
  return NextResponse.json({ request: data });
}
