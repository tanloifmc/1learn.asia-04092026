import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value, updated_at")
    .eq("is_public", true)
    .order("key");

  if (error) return NextResponse.json({ error: "Unable to load public settings" }, { status: 500 });
  return NextResponse.json({ settings: data });
}
