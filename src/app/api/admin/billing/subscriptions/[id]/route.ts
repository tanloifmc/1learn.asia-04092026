import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { writeAuditLog } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ isActive: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getAdministratorForApi();
  if (!account) return forbiddenResponse();
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid membership input" }, { status: 422 });
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("membership_subscriptions").update({ is_active: parsed.data.isActive }).eq("id", id).select("id, user_id, is_active").single();
  if (error) return NextResponse.json({ error: "Unable to update membership" }, { status: 500 });
  await writeAuditLog({ actorUserId: account.userId, action: "membership_subscription.updated", entityType: "membership_subscription", entityId: data.id, metadata: { userId: data.user_id, isActive: data.is_active } }).catch(() => undefined);
  return NextResponse.json({ subscription: data });
}
