import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, getContentManagerForApi } from "@/lib/api/authorization";
import { createClient } from "@/lib/supabase/server";

const categorySchema = z.object({ name: z.string().trim().min(1).max(100), slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().max(500).nullable().optional() });
export async function GET() { if (!(await getContentManagerForApi())) return forbiddenResponse(); const supabase = await createClient(); const { data, error } = await supabase.from("content_categories").select("id, name, slug, description, updated_at").order("name"); return error ? NextResponse.json({ error: "Unable to load categories" }, { status: 500 }) : NextResponse.json({ categories: data }); }
export async function POST(request: Request) { if (!(await getContentManagerForApi())) return forbiddenResponse(); const body = await request.json().catch(() => null); const parsed = categorySchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Invalid category input" }, { status: 422 }); const supabase = await createClient(); const { data, error } = await supabase.from("content_categories").insert({ name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description ?? null }).select("id, name, slug").single(); return error ? NextResponse.json({ error: "Unable to create category" }, { status: 500 }) : NextResponse.json({ category: data }, { status: 201 }); }
