import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { userId } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const admin = createAdminClient();
  const organization = await admin.from("organizations").select("id").eq("owner_id", userId).maybeSingle();
  if (!organization.data) return NextResponse.json({ error: "Provider organization not found" }, { status: 404 });
  const { data, error } = await admin.from("inquiries").select("id, sender_user_id, subject, message, status, created_at").eq("organization_id", organization.data.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load provider inquiries" }, { status: 400 });
  return NextResponse.json({ inquiries: data });
}
