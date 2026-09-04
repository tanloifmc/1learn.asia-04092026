import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("live account journey", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(90_000);
  let adminClient: ReturnType<typeof createClient>;
  let user: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const password = `CoreAccount!${randomUUID()}`;
    const { data, error } = await adminClient.auth.admin.createUser({
      email: `core-account-${randomUUID()}@example.invalid`,
      email_confirm: true,
      password,
      user_metadata: { display_name: "Core Account" },
    });
    if (error || !data.user) throw new Error(`Could not create account user: ${error?.message ?? "unknown error"}`);
    user = { id: data.user.id, email: data.user.email as string, password };
  });

  test.afterAll(async () => {
    await adminClient.auth.admin.deleteUser(user.id);
  });

  async function login(page: import("@playwright/test").Page) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Mat khau").fill(user.password);
    const response = page.waitForResponse((item) => item.url().includes("/auth/v1/token") && item.request().method() === "POST", { timeout: 20_000 });
    await page.getByRole("button", { name: "Dang nhap" }).click();
    expect((await response).ok()).toBe(true);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  }

  test("user saves profile and notification preferences", async ({ page }) => {
    const displayName = `Core Profile ${randomUUID().slice(0, 8)}`;
    await login(page);
    await page.goto("/account");

    await page.getByLabel("Ten hien thi").fill(displayName);
    await page.getByLabel("So dien thoai").fill("0901234567");
    await page.getByLabel("Ngon ngu").fill("en");
    await page.getByLabel("Mui gio").fill("Asia/Singapore");
    const profileResponse = page.waitForResponse((item) => item.url().includes("/api/account/profile") && item.request().method() === "PATCH", { timeout: 30_000 });
    await page.getByRole("button", { name: "Luu thay doi" }).click();
    expect((await profileResponse).status()).toBe(200);
    await expect(page.getByRole("status")).toContainText("Da cap nhat ho so.");

    await expect(page.getByRole("button", { name: "Luu tuy chon" })).toBeEnabled();
    await page.getByLabel("Email van hanh").uncheck();
    await page.getByLabel("Cap nhat san pham").check();
    const preferencesResponse = page.waitForResponse((item) => item.url().includes("/api/account/preferences") && item.request().method() === "PATCH", { timeout: 30_000 });
    await page.getByRole("button", { name: "Luu tuy chon" }).click();
    expect((await preferencesResponse).status()).toBe(200);
    await expect(page.getByText("Da luu tuy chon thong bao.", { exact: true })).toBeVisible();

    await expect.poll(async () => {
      const [{ data: profile }, { data: preferences }] = await Promise.all([
        (adminClient as any).from("profiles").select("display_name, phone, locale, timezone").eq("id", user.id).maybeSingle(),
        (adminClient as any).from("account_preferences").select("email_notifications, product_updates").eq("user_id", user.id).maybeSingle(),
      ]);
      return profile?.display_name === displayName
        && profile.phone === "0901234567"
        && profile.locale === "en"
        && profile.timezone === "Asia/Singapore"
        && preferences?.email_notifications === false
        && preferences.product_updates === true;
    }, { timeout: 20_000 }).toBe(true);

    const updatedPassword = `CoreUpdated!${randomUUID()}`;
    await page.getByLabel("Mat khau moi").fill(updatedPassword);
    await page.getByLabel("Xac nhan mat khau").fill(updatedPassword);
    const passwordResponse = page.waitForResponse((item) => item.url().includes("/api/account/password") && item.request().method() === "PATCH", { timeout: 30_000 });
    await page.getByRole("button", { name: "Doi mat khau" }).click();
    expect((await passwordResponse).status()).toBe(200);
    await expect(page.getByText("Da cap nhat mat khau.", { exact: true })).toBeVisible();

    user.password = updatedPassword;
    await page.getByRole("button", { name: "Dang xuat" }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
    await login(page);
  });
});


