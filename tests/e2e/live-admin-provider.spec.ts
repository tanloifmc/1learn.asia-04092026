import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("live administrator provider moderation", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(90_000);
  let adminClient: ReturnType<typeof createClient>;
  let operator: { id: string; email: string; password: string };
  let provider: { id: string; email: string; password: string };
  let organizationId = "";
  let organizationSlug = "";

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    async function createUser(label: string) {
      const password = `CoreAdmin!${randomUUID()}`;
      const { data, error } = await adminClient.auth.admin.createUser({ email: `core-admin-${label}-${randomUUID()}@example.invalid`, email_confirm: true, password });
      if (error || !data.user) throw new Error(`Could not create ${label}: ${error?.message ?? "unknown error"}`);
      return { id: data.user.id, email: data.user.email, password };
    }
    operator = await createUser("operator");
    provider = await createUser("provider");
    await adminClient.from("user_roles").upsert({ user_id: operator.id, role: "admin" }, { onConflict: "user_id,role" });
    organizationSlug = `core-moderation-${randomUUID().slice(0, 8)}`;
    const { data, error } = await adminClient.from("organizations").insert({ owner_id: provider.id, name: "Core Moderation Provider", slug: organizationSlug, status: "pending_review" }).select("id").single();
    if (error || !data) throw new Error(`Could not create moderation organization: ${error?.message ?? "unknown error"}`);
    organizationId = data.id;
  });

  test.afterAll(async () => {
    await adminClient.from("organizations").delete().eq("id", organizationId);
    await adminClient.auth.admin.deleteUser(operator.id);
    await adminClient.auth.admin.deleteUser(provider.id);
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

  test("admin approves a provider and provider receives a notification", async ({ browser, page }) => {
    await login(page, operator);
    await page.goto("/admin/providers");
    await expect(page.getByRole("heading", { name: "Duyet nha cung cap" })).toBeVisible();
    const providerCard = page.getByRole("article").filter({ hasText: organizationSlug });
    await expect(providerCard).toBeVisible({ timeout: 30_000 });
    expect((await page.request.get(`/api/providers/${organizationSlug}`)).status()).toBe(404);
    const approveButton = providerCard.getByRole("button", { name: "Duyet" });
    await approveButton.scrollIntoViewIfNeeded();
    await expect(approveButton).toBeInViewport();
    const approveResponse = page.waitForResponse((item) => item.url().includes(`/api/admin/providers/${organizationId}/status`) && item.request().method() === "PATCH", { timeout: 45_000 });
    await approveButton.click();
    expect((await approveResponse).ok()).toBe(true);

    const providerContext = await browser.newContext();
    const providerPage = await providerContext.newPage();
    try {
      await login(providerPage, provider);
      await providerPage.goto("/notifications");
      await expect(providerPage.getByRole("heading", { name: "Thong bao" })).toBeVisible();
      await expect(providerPage.getByText("Cap nhat ho so doanh nghiep")).toBeVisible({ timeout: 30_000 });
    } finally {
      await providerContext.close();
    }

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    try {
      await publicPage.goto("/providers");
      await expect(publicPage.getByRole("link", { name: "Core Moderation Provider" })).toHaveAttribute("href", `/providers/${organizationSlug}`);
      await publicPage.goto(`/providers/${organizationSlug}`);
      await expect(publicPage.getByRole("heading", { name: "Core Moderation Provider" })).toBeVisible();
    } finally {
      await publicContext.close();
    }
  });
});
