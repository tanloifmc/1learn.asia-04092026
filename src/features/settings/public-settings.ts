import { z } from "zod";
import { hasPublicSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const linksSchema = z.array(z.object({ href: z.string().startsWith("/").max(500), label: z.string().trim().min(1).max(80) })).max(12);
const brandingSchema = z.object({ appName: z.string().trim().min(1).max(80) });
const homeContentSchema = z.object({ eyebrow: z.string().trim().max(80), title: z.string().trim().min(1).max(160), description: z.string().trim().min(1).max(500), primaryCtaLabel: z.string().trim().min(1).max(50), primaryCtaHref: z.string().startsWith("/").max(500) });
const socialLinksSchema = z.array(z.object({ label: z.string().trim().min(1).max(80), href: z.string().url().max(500) })).max(8);

export async function getPublicNavigationSettings() {
  const fallback = { branding: { appName: "1learn.asia" }, headerLinks: null, footerLinks: null, socialLinks: [] };
  if (!hasPublicSupabaseConfig()) return fallback;
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value").eq("is_public", true).in("key", ["branding", "header_navigation", "footer_navigation", "social_links"]);
  const values = new Map(data?.map((setting) => [setting.key, setting.value]) ?? []);
  return {
    branding: brandingSchema.safeParse(values.get("branding")).success ? brandingSchema.parse(values.get("branding")) : { appName: "1learn.asia" },
    headerLinks: linksSchema.safeParse(values.get("header_navigation")).success ? linksSchema.parse(values.get("header_navigation")) : null,
    footerLinks: linksSchema.safeParse(values.get("footer_navigation")).success ? linksSchema.parse(values.get("footer_navigation")) : null,
    socialLinks: socialLinksSchema.safeParse(values.get("social_links")).success ? socialLinksSchema.parse(values.get("social_links")) : [],
  };
}

export async function getPublicHomeContent() {
  const fallback = { eyebrow: "Hướng nghiệp cá nhân hóa", title: "1learn.asia", description: "Nền tảng hướng nghiệp khoa học dành cho học sinh THPT.", primaryCtaLabel: "Khám phá", primaryCtaHref: "/register" };
  if (!hasPublicSupabaseConfig()) return fallback;
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("value").eq("key", "home_content").eq("is_public", true).maybeSingle();
  return homeContentSchema.safeParse(data?.value).success ? homeContentSchema.parse(data?.value) : fallback;
}
