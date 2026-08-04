import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("live provider onboarding journey", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(60_000);

  let userId: string | null = null;
  let email = "";
  let password = "";
  let admin: ReturnType<typeof createClient>;

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    password = `CoreProvider!${randomUUID()}`;
    email = `core-provider-${randomUUID()}@example.invalid`;
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true, password });
    if (error || !data.user) throw new Error(`Could not create provider test user: ${error?.message ?? "unknown error"}`);
    userId = data.user.id;
  });

  test.afterAll(async () => {
    if (!userId) return;
    const { error: organizationError } = await admin.from("organizations").delete().eq("owner_id", userId);
    if (organizationError) throw new Error(`Could not remove provider test organization: ${organizationError.message}`);
    const { error: userError } = await admin.auth.admin.deleteUser(userId);
    if (userError) throw new Error(`Could not remove provider test user: ${userError.message}`);
  });

  test("user creates a provider profile, gains provider role and submits it for review", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mat khau").fill(password);
    const signInResponse = page.waitForResponse((response) => response.url().includes("/auth/v1/token") && response.request().method() === "POST", { timeout: 20_000 });
    await page.getByRole("button", { name: "Dang nhap" }).click();
    expect((await signInResponse).ok()).toBe(true);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

    await page.goto("/provider");
    await expect(page.getByRole("heading", { name: "Doanh nghiep cua ban" })).toBeVisible();
    await page.getByLabel("Ten doanh nghiep").fill("Core Provider Acceptance");
    await page.getByLabel("Slug").fill(`core-provider-${randomUUID().slice(0, 8)}`);
    await page.getByLabel("Email lien he").fill("provider@example.invalid");
    const saveResponse = page.waitForResponse((response) => response.url().includes("/api/provider/organization") && response.request().method() === "POST", { timeout: 45_000 });
    await page.getByRole("button", { name: "Luu ho so" }).click();
    expect((await saveResponse).status()).toBe(201);
    await expect(page.getByText("Da luu ho so nha cung cap.")).toBeVisible();
    await expect(page.getByText(/Trang thai:/)).toContainText("draft");

    const reviewResponse = page.waitForResponse((response) => response.url().includes("/api/provider/submit-for-review") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Gui duyet" }).click();
    expect((await reviewResponse).ok()).toBe(true);
    await expect(page.getByText("Ho so da gui de duyet.")).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText(/Vai tro:/)).toContainText("provider");
  });
});
