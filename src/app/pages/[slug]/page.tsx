import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { defaultPublicPages } from "@/lib/content/default-public-pages";
import { createClient } from "@/lib/supabase/server";

async function getPage(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("content_pages").select("title, body, seo_title, seo_description, published_at").eq("slug", slug).eq("status", "published").maybeSingle();
  return data;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const page = await getPage(slug);
  const fallback = defaultPublicPages[slug];
  return page ? { title: page.seo_title || page.title, description: page.seo_description || undefined } : fallback ? { title: fallback.title, description: fallback.seoDescription } : {};
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const page = await getPage(slug);
  const fallback = defaultPublicPages[slug];
  if (!page && !fallback) notFound();
  const content = page ? { title: page.title, body: page.body } : fallback!;
  return <main className="content-article stack"><h1>{content.title}</h1><div className="content-body">{String(content.body).split("\n").map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</div></main>;
}
