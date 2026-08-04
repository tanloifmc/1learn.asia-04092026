import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

export async function GET() {
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { data, error } = await supabase.from("inquiries").select("id, organization_id, subject, message, status, created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load inquiries" }, { status: 400 });
  return NextResponse.json({ inquiries: data });
}
