import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { rateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/resend";

const supportRequestSchema = z.object({
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(2).max(5000),
});

export async function GET() {
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { data, error } = await supabase.from("support_requests").select("id, subject, message, status, created_at, updated_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load support requests" }, { status: 500 });
  return NextResponse.json({ requests: data });
}

export async function POST(request: Request) {
  const parsed = supportRequestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid support request" }, { status: 422 });
  const { supabase, userId, email } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const limited = rateLimit(`support:${userId}`, 5, 60 * 60 * 1000);
  if (limited) return limited;
  const { data, error } = await supabase.from("support_requests").insert({ sender_user_id: userId, ...parsed.data }).select("id, subject").single();
  if (error) return NextResponse.json({ error: "Unable to send support request" }, { status: 500 });

  const admin = createAdminClient();
  const { data: roles } = await admin.from("user_roles").select("user_id").in("role", ["admin", "super_admin"]);
  const recipientIds = [...new Set(roles?.map((role) => role.user_id) ?? [])];
  if (recipientIds.length) await admin.from("notifications").insert(recipientIds.map((recipientUserId) => ({ recipient_user_id: recipientUserId, type: "system", title: "Yeu cau ho tro moi", body: `Co yeu cau ho tro moi: ${data.subject}.`, action_url: "/admin/support" })));
  if (email) await sendTransactionalEmail({ to: email, subject: "Da nhan yeu cau ho tro", text: `Chung toi da nhan yeu cau ho tro: ${data.subject}. Ban co the theo doi trang thai tai khu vuc Lien he.`, html: "<p>Chung toi da nhan yeu cau ho tro.</p><p>Ban co the theo doi trang thai tai khu vuc Lien he.</p>", idempotencyKey: `support-request:${data.id}:received` }).catch(() => undefined);
  return NextResponse.json({ request: data }, { status: 201 });
}
