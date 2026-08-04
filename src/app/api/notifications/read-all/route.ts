import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

export async function PATCH() {
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) {
    return NextResponse.json({ error: "Unable to mark notifications as read" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
