import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { createAdminClient } from "@/lib/supabase/admin";

const organizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(5000).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().trim().max(30).nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
});

export async function GET() {
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { data, error } = await supabase.from("organizations").select("*").eq("owner_id", userId).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to load organization" }, { status: 400 });
  return NextResponse.json({ organization: data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = organizationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid organization input" }, { status: 400 });
  const { userId } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const admin = createAdminClient();
  const existing = await admin.from("organizations").select("id").eq("owner_id", userId).maybeSingle();
  if (existing.data) return NextResponse.json({ error: "Organization already exists" }, { status: 409 });
  const { data, error } = await admin.from("organizations").insert({
    owner_id: userId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    contact_email: parsed.data.contactEmail,
    contact_phone: parsed.data.contactPhone,
    website_url: parsed.data.websiteUrl,
  }).select("*").single();
  if (error) return NextResponse.json({ error: "Unable to create organization" }, { status: 400 });
  await admin.from("user_roles").upsert({ user_id: userId, role: "provider" }, { onConflict: "user_id,role" });
  return NextResponse.json({ organization: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = organizationSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid organization input" }, { status: 400 });
  const { userId } = await getAuthenticatedSession();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("organizations").update({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    contact_email: parsed.data.contactEmail,
    contact_phone: parsed.data.contactPhone,
    website_url: parsed.data.websiteUrl,
  }).eq("owner_id", userId).select("*").single();
  if (error) return NextResponse.json({ error: "Unable to update organization" }, { status: 400 });
  return NextResponse.json({ organization: data });
}
