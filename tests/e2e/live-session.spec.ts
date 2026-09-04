import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("live session management journey", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(90_000);
  let adminClient: ReturnType<typeof createClient>;
  let user: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const password = `CoreSession!${randomUUID()}`;
    const { data, error } = await adminClient.auth.admin.createUser({
      email: `core-session-${randomUUID()}@example.invalid`,
      email_confirm: true,
      password,
      user_metadata: { display_name: "Core Session" },
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
    await page.getByLabel("Mật khẩu").fill(user.password);
    const response = page.waitForResponse((item) => item.url().includes("/auth/v1/token") && item.request().method() === "POST", { timeout: 20_000 });
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    expect((await response).ok()).toBe(true);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  }

  test("user can log out of all other sessions", async ({ page }) => {
    await login(page);
    await page.goto("/account");
    
    const sessionManagerSection = page.locator("section").filter({ hasText: "Quản lý phiên đăng nhập" });
    await expect(sessionManagerSection).toBeVisible();
    
    const logoutOthersBtn = page.getByRole("button", { name: "Đăng xuất khỏi các thiết bị khác" });
    await expect(logoutOthersBtn).toBeVisible();
    
    await logoutOthersBtn.click();
    await expect(page.getByText("Đã đăng xuất thành công khỏi các thiết bị khác")).toBeVisible();
  });
});

