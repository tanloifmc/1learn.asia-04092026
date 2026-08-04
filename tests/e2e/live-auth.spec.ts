import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("live authentication journey", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");

  let userId: string | null = null;
  let email = "";
  let password = "";
  let admin: ReturnType<typeof createClient>;

  test.beforeAll(async () => {
    if (!url || !publishableKey || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    password = `CoreBrowser!${randomUUID()}`;
    email = `core-browser-${randomUUID()}@example.invalid`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: { display_name: "Core browser acceptance" },
    });
    if (error || !data.user) throw new Error(`Could not create live browser test user: ${error?.message ?? "unknown error"}`);
    userId = data.user.id;
  });

  test.afterAll(async () => {
    if (!userId) return;
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new Error(`Could not remove live browser test user: ${error.message}`);
  });

  test("user can log in, reach dashboard and log out", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mat khau").fill(password);
    const signInResponse = page.waitForResponse(
      (response) => response.url().includes("/auth/v1/token") && response.request().method() === "POST",
      { timeout: 20_000 },
    );
    await page.getByRole("button", { name: "Dang nhap" }).click();
    const response = await signInResponse;
    expect(response.ok(), `Supabase sign-in returned ${response.status()}`).toBe(true);

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Vai tro: user")).toBeVisible();

    await page.getByRole("button", { name: "Dang xuat" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });
});
