import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, getContentManagerForApi } from "@/lib/api/authorization";
import { writeAuditLog } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(), title: z.string().trim().min(1).max(180).optional(),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  excerpt: z.string().trim().max(500).nullable().optional(), body: z.string().trim().min(1).optional(),
  coverImageUrl: z.string().url().nullable().optional(), status: z.enum(["draft", "published", "archived"]).optional(),
  seoTitle: z.string().trim().max(180).nullable().optional(), seoDescription: z.string().trim().max(320).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getContentManagerForApi();
  if (!account) return forbiddenResponse();
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid post input" }, { status: 422 });

  const input = parsed.data;
  const update = {
    ...(input.categoryId !== undefined ? { category_id: input.categoryId } : {}), ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}), ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
    ...(input.body !== undefined ? { body: input.body } : {}), ...(input.coverImageUrl !== undefined ? { cover_image_url: input.coverImageUrl } : {}),
    ...(input.seoTitle !== undefined ? { seo_title: input.seoTitle } : {}), ...(input.seoDescription !== undefined ? { seo_description: input.seoDescription } : {}),
    ...(input.status !== undefined ? { status: input.status, published_at: input.status === "published" ? new Date().toISOString() : null } : {}),
  };
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_posts").update(update).eq("id", id).select("id, slug, status").single();
  if (error) return NextResponse.json({ error: "Unable to update post" }, { status: 500 });
  await writeAuditLog({
    actorUserId: account.userId,
    action: "content_post.updated",
    entityType: "content_post",
    entityId: data.id,
    metadata: { slug: data.slug, status: data.status },
  }).catch(() => undefined);
  return NextResponse.json({ post: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getContentManagerForApi();
  if (!account || !account.roles.some((role) => role === "admin" || role === "super_admin")) return forbiddenResponse();
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("content_posts").update({ status: "archived" }).eq("id", id);
  if (error) return NextResponse.json({ error: "Unable to archive post" }, { status: 500 });
  await writeAuditLog({ actorUserId: account.userId, action: "content_post.archived", entityType: "content_post", entityId: id }).catch(() => undefined);
  return new NextResponse(null, { status: 204 });
}
