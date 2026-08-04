import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("live inquiry journey", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(90_000);
  let admin: ReturnType<typeof createClient>;
  let sender: { id: string; email: string; password: string };
  let provider: { id: string; email: string; password: string };
  let organizationId = "";

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    async function createUser(label: string) {
      const password = `CoreInquiry!${randomUUID()}`;
      const { data, error } = await admin.auth.admin.createUser({ email: `core-inquiry-${label}-${randomUUID()}@example.invalid`, email_confirm: true, password });
      if (error || !data.user) throw new Error(`Could not create ${label}: ${error?.message ?? "unknown error"}`);
      return { id: data.user.id, email: data.user.email, password };
    }
    sender = await createUser("sender");
    provider = await createUser("provider");
    const { data, error } = await admin.from("organizations").insert({ owner_id: provider.id, name: "Core Inquiry Provider", slug: `core-inquiry-${randomUUID().slice(0, 8)}`, status: "approved" }).select("id").single();
    if (error || !data) throw new Error(`Could not create provider organization: ${error?.message ?? "unknown error"}`);
    organizationId = data.id;
    await admin.from("user_roles").upsert({ user_id: provider.id, role: "provider" }, { onConflict: "user_id,role" });
  });

  test.afterAll(async () => {
    await admin.from("inquiries").delete().eq("organization_id", organizationId);
    await admin.from("organizations").delete().eq("id", organizationId);
    await admin.auth.admin.deleteUser(sender.id);
    await admin.auth.admin.deleteUser(provider.id);
  });

  async function login(page: import("@playwright/test").Page, user: { email: string; password: string }) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Mat khau").fill(user.password);
    const response = page.waitForResponse((item) => item.url().includes("/auth/v1/token") && item.request().method() === "POST", { timeout: 20_000 });
    await page.getByRole("button", { name: "Dang nhap" }).click();
    expect((await response).ok()).toBe(true);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  }

  test("sender submits an inquiry and provider updates it", async ({ browser, page }) => {
    await login(page, sender);
    await page.goto(`/inquiries/new/${organizationId}`);
    await page.getByLabel("Tieu de").fill("Core inquiry acceptance");
    await page.getByLabel("Noi dung").fill("Please confirm this inquiry reaches the provider inbox.");
    const createResponse = page.waitForResponse((item) => item.url().includes("/api/inquiries") && item.request().method() === "POST", { timeout: 45_000 });
    await page.getByRole("button", { name: "Gui yeu cau" }).click();
    expect((await createResponse).status()).toBe(201);
    await expect(page.getByText("Da gui yeu cau. Nha cung cap se nhan thong bao.")).toBeVisible();

    const providerContext = await browser.newContext();
    const providerPage = await providerContext.newPage();
    try {
      await login(providerPage, provider);
      await providerPage.goto("/provider/inquiries");
      await expect(providerPage.getByRole("heading", { name: "Yeu cau nhan duoc" })).toBeVisible();
      await expect(providerPage.getByText("Core inquiry acceptance")).toBeVisible({ timeout: 30_000 });
      const updateResponse = providerPage.waitForResponse((item) => item.url().includes("/api/provider/inquiries/") && item.request().method() === "PATCH", { timeout: 45_000 });
      await providerPage.getByRole("button", { name: "Da doc" }).click();
      expect((await updateResponse).ok()).toBe(true);
      await expect(providerPage.getByText("Trang thai: read")).toBeVisible();
    } finally {
      await providerContext.close();
    }
  });
});
