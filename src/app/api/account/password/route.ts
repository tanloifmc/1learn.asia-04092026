import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
const schema = z.object({ password: z.string().min(12).max(128) });
export async function PATCH(request: Request) { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Password must be 12 to 128 characters" }, { status: 422 }); const { supabase, userId } = await getAuthenticatedSession(); if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 }); const { error } = await supabase.auth.updateUser({ password: parsed.data.password }); return error ? NextResponse.json({ error: "Unable to change password" }, { status: 400 }) : NextResponse.json({ ok: true }); }
