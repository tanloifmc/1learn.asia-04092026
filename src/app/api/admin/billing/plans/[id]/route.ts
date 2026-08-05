import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { writeAuditLog } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ code: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), name: z.string().trim().min(1).max(120).optional(), description: z.string().trim().max(1000).nullable().optional(), priceAmount: z.number().int().positive().optional(), currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).optional(), durationDays: z.number().int().positive().optional(), isActive: z.boolean().optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getAdministratorForApi();
  if (!account) return forbiddenResponse();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan input" }, { status: 422 });
  const { id } = await params;
  const input = parsed.data;
  const update = { ...(input.code !== undefined ? { code: input.code } : {}), ...(input.name !== undefined ? { name: input.name } : {}), ...(input.description !== undefined ? { description: input.description } : {}), ...(input.priceAmount !== undefined ? { price_amount: input.priceAmount } : {}), ...(input.currency !== undefined ? { currency: input.currency } : {}), ...(input.durationDays !== undefined ? { duration_days: input.durationDays } : {}), ...(input.isActive !== undefined ? { is_active: input.isActive } : {}) };
  const supabase = await createClient();
  const { data, error } = await supabase.from("membership_plans").update(update).eq("id", id).select("id, code, name, is_active").single();
  if (error) return NextResponse.json({ error: "Unable to update plan" }, { status: 500 });
  await writeAuditLog({ actorUserId: account.userId, action: "membership_plan.updated", entityType: "membership_plan", entityId: data.id, metadata: { code: data.code, isActive: data.is_active } }).catch(() => undefined);
  return NextResponse.json({ plan: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getAdministratorForApi();
  if (!account) return forbiddenResponse();
  const { id } = await params;
  const supabase = await createClient();
  const { count, error: countError } = await supabase.from("membership_subscriptions").select("id", { count: "exact", head: true }).eq("plan_id", id);
  if (countError) return NextResponse.json({ error: "Unable to check plan usage" }, { status: 500 });
  if (count) return NextResponse.json({ error: "Plan has subscriptions and cannot be deleted" }, { status: 409 });

  const { data, error } = await supabase.from("membership_plans").delete().eq("id", id).select("id, code").maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to delete plan" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  await writeAuditLog({ actorUserId: account.userId, action: "membership_plan.deleted", entityType: "membership_plan", entityId: data.id, metadata: { code: data.code } }).catch(() => undefined);
  return new NextResponse(null, { status: 204 });
}
