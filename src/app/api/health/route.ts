import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasPublicSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString(), checks: { publicSupabaseConfig: hasPublicSupabaseConfig } }, { headers: { "Cache-Control": "no-store" } });
}
