import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_posts")
    .select("id, title, slug, excerpt, cover_image_url, published_at, content_categories(name, slug)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load posts" }, { status: 500 });
  }

  return NextResponse.json({ posts: data });
}
