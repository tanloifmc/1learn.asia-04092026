import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_posts")
    .select("id, title, slug, excerpt, body, cover_image_url, seo_title, seo_description, published_at, content_categories(name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Unable to load post" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post: data });
}
