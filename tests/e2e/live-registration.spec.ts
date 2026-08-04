import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_EMAIL_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("live registration journey", () => {
  test.skip(!enabled, "Set RUN_LIVE_EMAIL_AUTH=true after configuring email delivery to run this live acceptance suite.");
  test.setTimeout(60_000);
  let adminClient: ReturnType<typeof createClient>;
  let userId = "";

  test.beforeAll(() => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  });

  test.afterAll(async () => {
    if (userId) await adminClient.auth.admin.deleteUser(userId);
  });

  test("visitor registers and receives core account records", async ({ page }) => {
    const email = `core-register-${randomUUID()}@example.com`;
    const password = `CoreRegister!${randomUUID()}`;
    const displayName = `Core Register ${randomUUID().slice(0, 8)}`;

    await page.goto("/register");
    await page.getByLabel("Ten hien thi").fill(displayName);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mat khau").fill(password);
    const signUpResponse = page.waitForResponse((item) => item.url().includes("/auth/v1/signup") && item.request().method() === "POST", { timeout: 30_000 });
    await page.getByRole("button", { name: "Tao tai khoan" }).click();
    const result = await signUpResponse;
    expect(result.status(), await result.text()).toBe(200);
    const response = await result.json();
    userId = response.user?.id;
    expect(userId).toBeTruthy();
    await expect(page.getByRole("status")).toContainText("Kiem tra email");

    await expect.poll(async () => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        adminClient.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
        adminClient.from("user_roles").select("role").eq("user_id", userId),
      ]);
      return profile?.display_name === displayName && roles?.some(({ role }) => role === "user");
    }, { timeout: 20_000 }).toBe(true);
  });
});
