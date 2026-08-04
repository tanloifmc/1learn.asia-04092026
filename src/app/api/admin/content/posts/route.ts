import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, getContentManagerForApi } from "@/lib/api/authorization";
import { writeAuditLog } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

const postSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().max(500).nullable().optional(),
  body: z.string().trim().min(1),
  coverImageUrl: z.string().url().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]),
  seoTitle: z.string().trim().max(180).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
});

export async function GET() {
  if (!(await getContentManagerForApi())) {
    return forbiddenResponse();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_posts")
    .select("id, category_id, title, slug, excerpt, body, cover_image_url, status, seo_title, seo_description, published_at, updated_at, content_categories(name)")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Unable to load posts" }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(request: Request) {
  const account = await getContentManagerForApi();
  if (!account) return forbiddenResponse();

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid post input" }, { status: 422 });

  const post = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_posts").insert({
    category_id: post.categoryId ?? null,
    author_id: account.userId,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? null,
    body: post.body,
    cover_image_url: post.coverImageUrl ?? null,
    status: post.status,
    seo_title: post.seoTitle ?? null,
    seo_description: post.seoDescription ?? null,
    published_at: post.status === "published" ? new Date().toISOString() : null,
  }).select("id, slug, status").single();

  if (error) return NextResponse.json({ error: "Unable to create post" }, { status: 500 });
  await writeAuditLog({
    actorUserId: account.userId,
    action: "content_post.created",
    entityType: "content_post",
    entityId: data.id,
    metadata: { slug: data.slug, status: data.status },
  }).catch(() => undefined);
  return NextResponse.json({ post: data }, { status: 201 });
}
