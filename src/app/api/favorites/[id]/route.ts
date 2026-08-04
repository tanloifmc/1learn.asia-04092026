import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid favorite id" }, { status: 400 });
  }

  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { error } = await supabase.from("favorites").delete().eq("id", parsed.data.id);
  if (error) {
    return NextResponse.json({ error: "Unable to remove favorite" }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
