import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

export async function GET() {
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { data, error } = await supabase.from("membership_subscriptions").select("id, starts_at, ends_at, is_active, membership_plans(name, code)").eq("user_id", userId).order("ends_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to load subscription" }, { status: 500 });
  return NextResponse.json({ subscription: data });
}
