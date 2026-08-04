import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FavoriteToggle } from "@/components/favorites/favorite-toggle";

async function getPost(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("content_posts").select("id, title, slug, body, excerpt, cover_image_url, seo_title, seo_description, published_at, content_categories(name)").eq("slug", slug).eq("status", "published").maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post ? { title: post.seo_title || post.title, description: post.seo_description || post.excerpt || undefined } : {};
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return <main className="content-article stack"><p className="eyebrow">{post.published_at ? new Date(post.published_at).toLocaleDateString("vi-VN") : ""}</p><h1>{post.title}</h1>{post.cover_image_url ? <Image alt="" className="content-cover" height={700} src={post.cover_image_url} unoptimized width={1200} /> : null}<p className="content-excerpt">{post.excerpt}</p><FavoriteToggle entityId={post.id} entityType="content_post" /><div className="content-body">{String(post.body).split("\n").map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</div></main>;
}
