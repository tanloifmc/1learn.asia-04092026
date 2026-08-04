import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function writeAuditLog(input: { actorUserId?: string; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown> }) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({ actor_user_id: input.actorUserId ?? null, action: input.action, entity_type: input.entityType, entity_id: input.entityId ?? null, metadata: input.metadata ?? {} });
  if (error) throw new Error("Unable to write audit log");
}
