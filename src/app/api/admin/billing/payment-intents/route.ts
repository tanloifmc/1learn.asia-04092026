import { NextResponse } from "next/server";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { createClient } from "@/lib/supabase/server";
export async function GET() { if (!(await getAdministratorForApi())) return forbiddenResponse(); const supabase = await createClient(); const { data, error } = await supabase.from("payment_intents").select("id, user_id, amount_vnd, payment_reference, status, expires_at, confirmed_at, created_at, membership_plans(name, code)").order("created_at", { ascending: false }).limit(200); return error ? NextResponse.json({ error: "Unable to load payment intents" }, { status: 500 }) : NextResponse.json({ paymentIntents: data }); }
