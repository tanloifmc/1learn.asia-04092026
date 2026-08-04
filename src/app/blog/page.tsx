import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase.from("content_posts").select("id, title, slug, excerpt, cover_image_url, published_at, content_categories(name)").eq("status", "published").order("published_at", { ascending: false });
  return <main className="stack"><p className="eyebrow">Noi dung</p><h1>Blog</h1>{posts?.length ? <section className="stack">{posts.map((post) => <article className="list-item stack" key={post.id}>{post.cover_image_url ? <Image alt="" className="content-cover" height={700} src={post.cover_image_url} unoptimized width={1200} /> : null}<h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><p>{post.published_at ? new Date(post.published_at).toLocaleDateString("vi-VN") : ""}</p></article>)}</section> : <p>Chua co bai viet duoc xuat ban.</p>}</main>;
}
