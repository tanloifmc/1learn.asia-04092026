import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
  }

  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Unable to mark notification as read" }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
