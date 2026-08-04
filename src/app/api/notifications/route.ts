import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

export async function GET() {
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, action_url, read_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load notifications" }, { status: 400 });
  }

  return NextResponse.json({ notifications: data });
}
