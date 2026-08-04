import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ status: z.enum(["read", "responded", "closed", "spam"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid inquiry status" }, { status: 422 });
  const { userId } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;
  const admin = createAdminClient();
  const { data: organization } = await admin.from("organizations").select("id").eq("owner_id", userId).maybeSingle();
  if (!organization) return NextResponse.json({ error: "Provider organization not found" }, { status: 404 });
  const { data: inquiry, error } = await admin.from("inquiries").update({ status: parsed.data.status }).eq("id", id).eq("organization_id", organization.id).select("id, sender_user_id, subject, status").single();
  if (error) return NextResponse.json({ error: "Unable to update inquiry" }, { status: 500 });
  await admin.from("notifications").insert({ recipient_user_id: inquiry.sender_user_id, type: "inquiry", title: "Cap nhat yeu cau lien he", body: `Yeu cau "${inquiry.subject}" da duoc cap nhat: ${inquiry.status}.`, action_url: "/inquiries" });
  return NextResponse.json({ inquiry });
}
