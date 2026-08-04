import { NextResponse } from "next/server";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  if (!(await getAdministratorForApi())) return forbiddenResponse();
  const admin = createAdminClient();
  const { data: requests, error } = await admin.from("support_requests").select("id, sender_user_id, subject, message, status, created_at, updated_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load support requests" }, { status: 500 });

  const senderIds = [...new Set(requests.map((request) => request.sender_user_id))];
  const { data: profiles, error: profilesError } = senderIds.length
    ? await admin.from("profiles").select("id, display_name").in("id", senderIds)
    : { data: [], error: null };
  if (profilesError) return NextResponse.json({ error: "Unable to load support request senders" }, { status: 500 });

  const profilesById = new Map(profiles.map((profile) => [profile.id, { display_name: profile.display_name }]));
  return NextResponse.json({
    requests: requests.map(({ sender_user_id, ...request }) => ({
      ...request,
      profiles: profilesById.get(sender_user_id) ?? null,
    })),
  });
}
