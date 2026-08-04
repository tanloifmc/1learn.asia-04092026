import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const { userId } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("organizations")
    .update({ status: "pending_review" })
    .eq("owner_id", userId)
    .in("status", ["draft", "rejected"])
    .select("id, status").single();
  if (error) return NextResponse.json({ error: "Unable to submit organization" }, { status: 400 });
  return NextResponse.json({ organization: data });
}
