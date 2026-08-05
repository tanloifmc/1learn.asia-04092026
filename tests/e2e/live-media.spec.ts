import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const imagePayload = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

test.describe("live media uploads", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(120_000);
  let admin: ReturnType<typeof createClient>;
  let user: { id: string; email: string; password: string };
  let provider: { id: string; email: string; password: string };
  let attacker: { id: string; email: string; password: string };
  let organizationId = "";

  test.beforeAll(async () => {
    if (!url || !publicKey || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    async function createUser(label: string) {
      const password = `CoreMedia!${randomUUID()}`;
      const { data, error } = await admin.auth.admin.createUser({ email: `core-media-${label}-${randomUUID()}@example.invalid`, email_confirm: true, password });
      if (error || !data.user) throw new Error(`Could not create ${label}: ${error?.message ?? "unknown error"}`);
      return { id: data.user.id, email: data.user.email, password };
    }
    user = await createUser("user");
    provider = await createUser("provider");
    attacker = await createUser("attacker");
    await admin.from("user_roles").upsert({ user_id: provider.id, role: "provider" }, { onConflict: "user_id,role" });
    const { data: organization, error } = await admin.from("organizations").insert({ owner_id: provider.id, name: `Core Media Provider ${randomUUID().slice(0, 8)}`, slug: `core-media-provider-${randomUUID().slice(0, 8)}`, status: "draft" }).select("id").single();
    if (error || !organization) throw new Error(`Could not create organization: ${error?.message ?? "unknown error"}`);
    organizationId = organization.id;
  });

  test.afterAll(async () => {
    for (const [bucket, prefix] of [["avatars", user.id], ["organization-media", organizationId]] as const) {
      const { data: files } = await admin.storage.from(bucket).list(prefix);
      if (files?.length) await admin.storage.from(bucket).remove(files.map((file) => `${prefix}/${file.name}`));
    }
    if (organizationId) await admin.from("organizations").delete().eq("id", organizationId);
    await admin.auth.admin.deleteUser(user.id);
    await admin.auth.admin.deleteUser(provider.id);
    await admin.auth.admin.deleteUser(attacker.id);
  });

  async function login(page: import("@playwright/test").Page, account: { email: string; password: string }) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Mat khau").fill(account.password);
    const response = page.waitForResponse((item) => item.url().includes("/auth/v1/token") && item.request().method() === "POST", { timeout: 20_000 });
    await page.getByRole("button", { name: "Dang nhap" }).click();
    expect((await response).ok()).toBe(true);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  }

  test("user uploads an avatar and provider uploads an organization logo", async ({ browser, page }) => {
    await login(page, user);
    await page.goto("/account");
    const invalidAvatarResponse = page.waitForResponse((item) => item.url().includes("/api/media/upload") && item.request().method() === "POST", { timeout: 30_000 });
    await page.getByLabel("Chon anh").setInputFiles({ name: "not-an-image.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
    expect((await invalidAvatarResponse).status()).toBe(422);
    await expect(page.getByRole("status")).toContainText("Khong the tai anh");
    expect((await admin.from("profiles").select("avatar_url").eq("id", user.id).single()).data?.avatar_url).toBeNull();
    const oversizedAvatarResponse = page.waitForResponse((item) => item.url().includes("/api/media/upload") && item.request().method() === "POST", { timeout: 30_000 });
    await page.getByLabel("Chon anh").setInputFiles({ name: "too-large.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 1) });
    expect((await oversizedAvatarResponse).status()).toBe(422);
    await expect(page.getByRole("status")).toContainText("Khong the tai anh");
    expect((await admin.from("profiles").select("avatar_url").eq("id", user.id).single()).data?.avatar_url).toBeNull();
    const avatarResponse = page.waitForResponse((item) => item.url().includes("/api/media/upload") && item.request().method() === "POST", { timeout: 30_000 });
    await page.getByLabel("Chon anh").setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: imagePayload });
    expect((await avatarResponse).status()).toBe(201);
    await expect(page.getByRole("status")).toContainText("Da tai anh len");
    await expect.poll(async () => (await admin.from("profiles").select("avatar_url").eq("id", user.id).single()).data?.avatar_url, { timeout: 20_000 }).toContain(`/avatars/${user.id}/`);

    const providerContext = await browser.newContext();
    const providerPage = await providerContext.newPage();
    try {
      await login(providerPage, provider);
      await providerPage.goto("/provider");
      const logoResponse = providerPage.waitForResponse((item) => item.url().includes("/api/media/upload") && item.request().method() === "POST", { timeout: 30_000 });
      await providerPage.getByRole("heading", { name: "Logo doanh nghiep" }).locator("..").getByLabel("Chon anh").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: imagePayload });
      expect((await logoResponse).status()).toBe(201);
      await expect(providerPage.getByRole("status")).toContainText("Da tai anh len");
      await expect.poll(async () => (await admin.from("organizations").select("logo_url").eq("id", organizationId).single()).data?.logo_url, { timeout: 20_000 }).toContain(`/organization-media/${organizationId}/`);
    } finally {
      await providerContext.close();
    }
  });

  test("storage RLS permits owners and rejects another authenticated user", async () => {
    const ownerClient = createClient(url!, publicKey!, { auth: { autoRefreshToken: false, persistSession: false } });
    const attackerClient = createClient(url!, publicKey!, { auth: { autoRefreshToken: false, persistSession: false } });
    const providerClient = createClient(url!, publicKey!, { auth: { autoRefreshToken: false, persistSession: false } });
    expect((await ownerClient.auth.signInWithPassword({ email: user.email, password: user.password })).error).toBeNull();
    expect((await providerClient.auth.signInWithPassword({ email: provider.email, password: provider.password })).error).toBeNull();
    expect((await attackerClient.auth.signInWithPassword({ email: attacker.email, password: attacker.password })).error).toBeNull();

    const suffix = randomUUID().slice(0, 8);
    const avatarPath = `${user.id}/rls-owner-${suffix}.png`;
    const logoPath = `${organizationId}/rls-owner-${suffix}.png`;
    expect((await ownerClient.storage.from("avatars").upload(avatarPath, imagePayload, { contentType: "image/png", upsert: false })).error).toBeNull();
    expect((await providerClient.storage.from("organization-media").upload(logoPath, imagePayload, { contentType: "image/png", upsert: false })).error).toBeNull();

    const forbiddenAvatarUpload = await attackerClient.storage.from("avatars").upload(`${user.id}/rls-forbidden-${suffix}.png`, imagePayload, { contentType: "image/png", upsert: false });
    await attackerClient.storage.from("avatars").remove([avatarPath]);
    const forbiddenLogoUpload = await attackerClient.storage.from("organization-media").upload(`${organizationId}/rls-forbidden-${suffix}.png`, imagePayload, { contentType: "image/png", upsert: false });
    await attackerClient.storage.from("organization-media").remove([logoPath]);
    expect(forbiddenAvatarUpload.error).not.toBeNull();
    expect(forbiddenLogoUpload.error).not.toBeNull();

    const [{ data: avatarFiles }, { data: logoFiles }] = await Promise.all([
      admin.storage.from("avatars").list(user.id),
      admin.storage.from("organization-media").list(organizationId),
    ]);
    expect(avatarFiles?.some((file) => file.name === `rls-owner-${suffix}.png`)).toBe(true);
    expect(logoFiles?.some((file) => file.name === `rls-owner-${suffix}.png`)).toBe(true);
  });
});
