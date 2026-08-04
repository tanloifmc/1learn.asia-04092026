import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth/current-account";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");
  if (!(file instanceof File) || (kind !== "avatar" && kind !== "organization" && kind !== "content")) return NextResponse.json({ error: "Invalid upload request" }, { status: 422 });
  if (!allowedTypes.has(file.type) || file.size > maxFileSize) return NextResponse.json({ error: "Only JPEG, PNG or WebP images up to 5 MB are allowed" }, { status: 422 });

  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const admin = createAdminClient();
  let bucket: string;
  let path: string;
  if (kind === "avatar") {
    bucket = "avatars";
    path = `${account.userId}/${randomUUID()}.${extension}`;
  } else if (kind === "organization") {
    const { data: organization } = await admin.from("organizations").select("id").eq("owner_id", account.userId).maybeSingle();
    if (!organization) return NextResponse.json({ error: "Provider organization not found" }, { status: 404 });
    bucket = "organization-media";
    path = `${organization.id}/${randomUUID()}.${extension}`;
  } else {
    if (!account.roles.some((role) => ["editor", "admin", "super_admin"].includes(role))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    bucket = "content-media";
    path = `uploads/${randomUUID()}.${extension}`;
  }

  const { error: uploadError } = await admin.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "Unable to upload file" }, { status: 500 });
  const { data: publicUrl } = admin.storage.from(bucket).getPublicUrl(path);
  if (kind === "avatar") await admin.from("profiles").update({ avatar_url: publicUrl.publicUrl }).eq("id", account.userId);
  if (kind === "organization") await admin.from("organizations").update({ logo_url: publicUrl.publicUrl }).eq("owner_id", account.userId);
  return NextResponse.json({ url: publicUrl.publicUrl }, { status: 201 });
}
