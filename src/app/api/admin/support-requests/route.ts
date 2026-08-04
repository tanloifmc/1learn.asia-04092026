import { NextResponse } from "next/server";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await getAdministratorForApi())) return forbiddenResponse();
  const supabase = await createClient();
  const { data, error } = await supabase.from("support_requests").select("id, subject, message, status, created_at, updated_at, profiles!support_requests_sender_user_id_fkey(display_name)").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load support requests" }, { status: 500 });
  return NextResponse.json({ requests: data });
}
