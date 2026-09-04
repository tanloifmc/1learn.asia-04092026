import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("live shared core journey", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(120_000);
  let adminClient: ReturnType<typeof createClient>;
  let administrator: { id: string; email: string; password: string };
  let user: { id: string; email: string; password: string };
  let otherUser: { id: string; email: string; password: string };
  let organizationId = "";
  let supportRequestId = "";

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    async function createUser(label: string) {
      const password = `CoreShared!${randomUUID()}`;
      const { data, error } = await adminClient.auth.admin.createUser({ email: `core-shared-${label}-${randomUUID()}@example.invalid`, email_confirm: true, password, user_metadata: { display_name: `Core ${label}` } });
      if (error || !data.user) throw new Error(`Could not create ${label}: ${error?.message ?? "unknown error"}`);
      return { id: data.user.id, email: data.user.email as string, password };
    }
    administrator = await createUser("admin");
    user = await createUser("user");
    otherUser = await createUser("other-user");
    await (adminClient as any).from("user_roles").upsert({ user_id: administrator.id, role: "admin" }, { onConflict: "user_id,role" });
    const { data: organization, error } = await (adminClient as any).from("organizations").insert({ owner_id: user.id, name: `Core Provider ${randomUUID().slice(0, 8)}`, slug: `core-provider-${randomUUID().slice(0, 8)}`, description: "Provider for shared core acceptance", status: "approved" }).select("id").single();
    if (error || !organization) throw new Error(`Could not create provider: ${error?.message ?? "unknown error"}`);
    organizationId = organization.id;
  });

  test.afterAll(async () => {
    if (supportRequestId) await (adminClient as any).from("support_requests").delete().eq("id", supportRequestId);
    await (adminClient as any).from("favorites").delete().eq("user_id", user.id);
    await (adminClient as any).from("notifications").delete().in("recipient_user_id", [administrator.id, user.id]);
    if (organizationId) await (adminClient as any).from("organizations").delete().eq("id", organizationId);
    await adminClient.auth.admin.deleteUser(administrator.id);
    await adminClient.auth.admin.deleteUser(user.id);
    await adminClient.auth.admin.deleteUser(otherUser.id);
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

  test("user favorites, support request and administrator notification workflow", async ({ browser, page }) => {
    await login(page, user);
    const { data: organization } = await (adminClient as any).from("organizations").select("slug").eq("id", organizationId).single();
    if (!organization) throw new Error("Provider was not available.");
    const unsupportedFavorite = await page.evaluate(async (entityId) => {
      const response = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entityType: "unsupported_entity", entityId }) });
      return response.status;
    }, organizationId);
    expect(unsupportedFavorite).toBe(400);
    await page.goto(`/providers/${organization.slug}`);
    const favoriteResponse = page.waitForResponse((item) => item.url().includes("/api/favorites") && item.request().method() === "POST", { timeout: 30_000 });
    await page.getByRole("button", { name: "Luu muc nay" }).click();
    expect((await favoriteResponse).status()).toBe(201);
    const duplicateFavorite = await page.evaluate(async ({ entityType, entityId }) => {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId }),
      });
      return { status: response.status, body: await response.json() };
    }, { entityType: "organization", entityId: organizationId });
    expect(duplicateFavorite.status).toBe(409);
    await page.goto("/favorites");
    await expect(page.getByText(organizationId, { exact: true })).toBeVisible();
    const removeFavorite = page.waitForResponse((item) => item.url().includes("/api/favorites/") && item.request().method() === "DELETE", { timeout: 30_000 });
    await page.getByRole("button", { name: "Bo luu" }).click();
    expect((await removeFavorite).status()).toBe(204);

    const supportSubject = `Core support ${randomUUID().slice(0, 8)}`;
    await page.goto("/contact");
    await page.getByLabel("Tieu de").fill(supportSubject);
    await page.getByLabel("Noi dung").fill("Yeu cau ho tro duoc gui trong nghiem thu Shared Core.");
    const supportResponse = page.waitForResponse((item) => item.url().includes("/api/support-requests") && item.request().method() === "POST", { timeout: 30_000 });
    await page.getByRole("button", { name: "Gui yeu cau" }).click();
    const createdSupport = await supportResponse;
    expect(createdSupport.status(), await createdSupport.text()).toBe(201);
    supportRequestId = (await createdSupport.json()).request.id;

    const otherUserContext = await browser.newContext();
    const otherUserPage = await otherUserContext.newPage();
    try {
      await login(otherUserPage, otherUser);
      const otherRequests = otherUserPage.waitForResponse((item) => item.url().includes("/api/support-requests") && item.request().method() === "GET", { timeout: 30_000 });
      await otherUserPage.goto("/contact");
      const otherResponse = await otherRequests;
      expect(otherResponse.status()).toBe(200);
      expect((await otherResponse.json()).requests).toEqual([]);
      await expect(otherUserPage.getByText(supportSubject, { exact: true })).toHaveCount(0);
    } finally {
      await otherUserContext.close();
    }

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    try {
      await login(adminPage, administrator);
      await adminPage.goto("/admin/notifications");
      const notificationTitle = `Core notification ${randomUUID().slice(0, 8)}`;
      await adminPage.getByLabel("User IDs").fill(user.id);
      await adminPage.getByLabel("Tieu de").fill(notificationTitle);
      await adminPage.getByLabel("Noi dung").fill("Thong bao tu quan tri vien.");
      const broadcastResponse = adminPage.waitForResponse((item) => item.url().includes("/api/admin/notifications/broadcast") && item.request().method() === "POST", { timeout: 30_000 });
      await adminPage.getByRole("button", { name: "Gui thong bao" }).click();
      expect((await broadcastResponse).status()).toBe(201);

      const secondNotificationTitle = `Core notification ${randomUUID().slice(0, 8)}`;
      await adminPage.getByLabel("User IDs").fill(user.id);
      await adminPage.getByLabel("Tieu de").fill(secondNotificationTitle);
      await adminPage.getByLabel("Noi dung").fill("Thong bao thu hai tu quan tri vien.");
      const secondBroadcastResponse = adminPage.waitForResponse((item) => item.url().includes("/api/admin/notifications/broadcast") && item.request().method() === "POST", { timeout: 30_000 });
      await adminPage.getByRole("button", { name: "Gui thong bao" }).click();
      expect((await secondBroadcastResponse).status()).toBe(201);

      await adminPage.goto("/admin/support");
      await expect(adminPage.getByRole("heading", { name: supportSubject })).toBeVisible({ timeout: 30_000 });
      const statusResponse = adminPage.waitForResponse((item) => item.url().includes(`/api/admin/support-requests/${supportRequestId}`) && item.request().method() === "PATCH", { timeout: 30_000 });
      await adminPage.getByLabel(`Trang thai ${supportSubject}`).selectOption("responded");
      expect((await statusResponse).status()).toBe(200);

      await page.goto("/notifications");
      await expect(page.getByRole("heading", { name: notificationTitle })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("heading", { name: secondNotificationTitle })).toBeVisible();
      const readResponse = page.waitForResponse((item) => item.url().includes("/api/notifications/") && item.url().includes("/read") && item.request().method() === "PATCH", { timeout: 30_000 });
      await page.getByRole("button", { name: "Danh dau da doc" }).first().click();
      expect((await readResponse).status()).toBe(200);
      await expect(page.getByText("Da doc", { exact: true })).toBeVisible();
      const readAllResponse = page.waitForResponse((item) => item.url().includes("/api/notifications/read-all") && item.request().method() === "PATCH", { timeout: 30_000 });
      await page.getByRole("button", { name: "Danh dau tat ca da doc" }).click();
      expect((await readAllResponse).status()).toBe(200);
      await expect(page.getByRole("button", { name: "Danh dau da doc" })).toHaveCount(0);
    } finally { await adminContext.close(); }

    await page.goto("/contact");
    await expect(page.getByText("responded", { exact: true })).toBeVisible({ timeout: 30_000 });
  });
});


