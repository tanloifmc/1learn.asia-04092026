import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

const favoriteSchema = z.object({
  entityType: z.string().trim().min(1).max(80).regex(/^[a-z][a-z0-9_]*$/),
  entityId: z.string().uuid(),
});

export async function GET(request: Request) {
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  let query = supabase.from("favorites").select("id, entity_type, entity_id, created_at").order("created_at", { ascending: false });
  if (entityType || entityId) {
    const parsed = favoriteSchema.safeParse({ entityType, entityId });
    if (!parsed.success) return NextResponse.json({ error: "Invalid favorite lookup" }, { status: 400 });
    query = query.eq("entity_type", parsed.data.entityType).eq("entity_id", parsed.data.entityId).limit(1);
  }
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Unable to load favorites" }, { status: 400 });
  }

  return NextResponse.json({ favorites: data });
}

export async function POST(request: Request) {
  const parsed = favoriteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid favorite input" }, { status: 400 });
  }

  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, entity_type: parsed.data.entityType, entity_id: parsed.data.entityId })
    .select("id, entity_type, entity_id, created_at")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 400;
    return NextResponse.json({ error: "Unable to create favorite" }, { status });
  }

  return NextResponse.json({ favorite: data }, { status: 201 });
}
