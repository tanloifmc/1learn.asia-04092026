import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { writeAuditLog } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ code: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name: z.string().trim().min(1).max(120), description: z.string().trim().max(1000).nullable().optional(), priceAmount: z.number().int().positive(), currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/), durationDays: z.number().int().positive(), isActive: z.boolean() });

export async function GET() {
  if (!(await getAdministratorForApi())) return forbiddenResponse();
  const supabase = await createClient();
  const { data, error } = await supabase.from("membership_plans").select("id, code, name, description, price_amount, currency, duration_days, is_active, updated_at").order("price_amount");
  return error ? NextResponse.json({ error: "Unable to load plans" }, { status: 500 }) : NextResponse.json({ plans: data });
}

export async function POST(request: Request) {
  const account = await getAdministratorForApi();
  if (!account) return forbiddenResponse();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan input" }, { status: 422 });
  const input = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("membership_plans").insert({ code: input.code, name: input.name, description: input.description ?? null, price_amount: input.priceAmount, currency: input.currency, duration_days: input.durationDays, is_active: input.isActive }).select("id, code, name").single();
  if (error) return NextResponse.json({ error: "Unable to create plan" }, { status: 500 });
  await writeAuditLog({ actorUserId: account.userId, action: "membership_plan.created", entityType: "membership_plan", entityId: data.id, metadata: { code: data.code } }).catch(() => undefined);
  return NextResponse.json({ plan: data }, { status: 201 });
}
