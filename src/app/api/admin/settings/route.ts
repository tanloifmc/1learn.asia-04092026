import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { forbiddenResponse, getAdministratorForApi } from "@/lib/api/authorization";
import { writeAuditLog } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

const settingSchema = z.object({
  key: z.string().trim().min(2).max(100).regex(/^[a-z][a-z0-9_]*$/),
  value: z.unknown(),
  isPublic: z.boolean(),
});

const internalLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  href: z.string().startsWith("/").max(500),
});
const publicSettingSchemas: Record<string, z.ZodType> = {
  branding: z.object({ appName: z.string().trim().min(1).max(80) }),
  header_navigation: z.array(internalLinkSchema).max(12),
  footer_navigation: z.array(internalLinkSchema).max(12),
  social_links: z.array(z.object({ label: z.string().trim().min(1).max(80), href: z.string().url().max(500) })).max(8),
  home_content: z.object({
    eyebrow: z.string().trim().max(80),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(500),
    primaryCtaLabel: z.string().trim().min(1).max(50),
    primaryCtaHref: z.string().startsWith("/").max(500),
  }),
};
const genericSettingSchema = z.record(z.string(), z.unknown());

export async function GET() {
  if (!(await getAdministratorForApi())) return forbiddenResponse();
  const supabase = await createClient();
  const { data, error } = await supabase.from("app_settings").select("key, value, is_public, updated_at").order("key");
  if (error) return NextResponse.json({ error: "Unable to load settings" }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PATCH(request: Request) {
  const account = await getAdministratorForApi();
  if (!account) return forbiddenResponse();
  const body = await request.json().catch(() => null);
  const parsed = settingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid setting input" }, { status: 422 });

  const input = parsed.data;
  const value = (publicSettingSchemas[input.key] ?? genericSettingSchema).safeParse(input.value);
  if (!value.success) return NextResponse.json({ error: "Invalid value for this setting" }, { status: 422 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("app_settings").upsert({
    key: input.key,
    value: value.data,
    is_public: input.isPublic,
    updated_by: account.userId,
  }).select("key, value, is_public, updated_at").single();

  if (error) return NextResponse.json({ error: "Unable to save setting" }, { status: 500 });
  revalidatePath("/", "layout");
  await writeAuditLog({
    actorUserId: account.userId,
    action: "setting.updated",
    entityType: "app_setting",
    entityId: input.key,
    metadata: { isPublic: input.isPublic },
  }).catch(() => undefined);
  return NextResponse.json({ setting: data });
}
