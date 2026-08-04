import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const imagePayload = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

test.describe("live media uploads", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(120_000);
  let admin: ReturnType<typeof createClient>;
  let user: { id: string; email: string; password: string };
  let provider: { id: string; email: string; password: string };
  let organizationId = "";

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    async function createUser(label: string) {
      const password = `CoreMedia!${randomUUID()}`;
      const { data, error } = await admin.auth.admin.createUser({ email: `core-media-${label}-${randomUUID()}@example.invalid`, email_confirm: true, password });
      if (error || !data.user) throw new Error(`Could not create ${label}: ${error?.message ?? "unknown error"}`);
      return { id: data.user.id, email: data.user.email, password };
    }
    user = await createUser("user");
    provider = await createUser("provider");
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
});
