import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";

const inquirySchema = z.object({ organizationId: z.string().uuid(), subject: z.string().trim().min(2).max(200), message: z.string().trim().min(2).max(5000) });

export async function POST(request: Request) {
  const parsed = inquirySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid inquiry input" }, { status: 400 });
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const limited = rateLimit(`inquiry:${userId}`, 10, 60 * 60 * 1000);
  if (limited) return limited;
  const { data, error } = await supabase.from("inquiries").insert({ sender_user_id: userId, organization_id: parsed.data.organizationId, subject: parsed.data.subject, message: parsed.data.message }).select("id").single();
  if (error) return NextResponse.json({ error: "Unable to send inquiry" }, { status: 400 });
  const admin = createAdminClient();
  const organization = await admin.from("organizations").select("owner_id, name").eq("id", parsed.data.organizationId).single();
  if (organization.data) await admin.from("notifications").insert({ recipient_user_id: organization.data.owner_id, type: "inquiry", title: "Yeu cau lien he moi", body: `Co yeu cau lien he moi cho ${organization.data.name}.`, action_url: "/provider/inquiries" });
  return NextResponse.json({ inquiry: data }, { status: 201 });
}
