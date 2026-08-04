import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("membership_plans").select("id, code, name, description, price_amount, currency, duration_days").eq("is_active", true).order("price_amount");
  if (error) return NextResponse.json({ error: "Unable to load membership plans" }, { status: 500 });
  return NextResponse.json({ plans: data });
}
