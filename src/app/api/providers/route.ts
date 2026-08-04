import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET() { const supabase = await createClient(); const { data, error } = await supabase.from("organizations").select("id, name, slug, logo_url, description, website_url").eq("status", "approved").order("name"); return error ? NextResponse.json({ error: "Unable to load providers" }, { status: 500 }) : NextResponse.json({ providers: data }); }
