import { NextResponse } from "next/server";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { createClient } from "@/lib/supabase/server";
export async function GET() { if (!(await getAdministratorForApi())) return forbiddenResponse(); const supabase = await createClient(); const { data, error } = await supabase.from("inquiries").select("id, sender_user_id, subject, message, status, created_at, organizations(name, slug)").order("created_at", { ascending: false }).limit(200); return error ? NextResponse.json({ error: "Unable to load inquiries" }, { status: 500 }) : NextResponse.json({ inquiries: data }); }
