import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("live membership lifecycle", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(90_000);
  let adminClient: ReturnType<typeof createClient>;
  let operator: { id: string; email: string; password: string };
  let member: { id: string; email: string; password: string };
  let planCode = "";
  let planName = "";
  let planId = "";
  let disposablePlanId = "";

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    async function createUser(label: string) {
      const password = `CoreMembership!${randomUUID()}`;
      const { data, error } = await adminClient.auth.admin.createUser({ email: `core-membership-${label}-${randomUUID()}@example.invalid`, email_confirm: true, password, user_metadata: { display_name: `Core ${label}` } });
      if (error || !data.user) throw new Error(`Could not create ${label}: ${error?.message ?? "unknown error"}`);
      return { id: data.user.id, email: data.user.email, password };
    }
    operator = await createUser("operator");
    member = await createUser("member");
    await adminClient.from("user_roles").upsert({ user_id: operator.id, role: "admin" }, { onConflict: "user_id,role" });
    planCode = `core-plan-${randomUUID().slice(0, 8)}`;
    planName = `Core Membership ${randomUUID().slice(0, 8)}`;
  });

  test.afterAll(async () => {
    if (planId) await adminClient.from("membership_subscriptions").delete().eq("plan_id", planId);
    if (disposablePlanId) await adminClient.from("membership_plans").delete().eq("id", disposablePlanId);
    if (planId) await adminClient.from("membership_plans").delete().eq("id", planId);
    await adminClient.auth.admin.deleteUser(operator.id);
    await adminClient.auth.admin.deleteUser(member.id);
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

  test("administrator manages a membership lifecycle and member sees its active state", async ({ browser, page }) => {
    await login(page, operator);
    const usersResponse = page.waitForResponse((item) => item.url().includes("/api/admin/users") && item.request().method() === "GET", { timeout: 30_000 });
    await page.goto("/admin/billing");
    const usersResult = await usersResponse;
    expect(usersResult.status(), await usersResult.text()).toBe(200);
    await expect(page.getByRole("heading", { name: "Goi thanh vien va thanh toan" })).toBeVisible();
    await page.getByLabel("Code").fill(planCode);
    await page.getByLabel("Ten goi").fill(planName);
    await page.getByLabel("Gia").fill("100000");
    await page.getByLabel("Ma tien te").fill("VND");
    await page.getByLabel("So ngay").fill("30");
    const planResponse = page.waitForResponse((item) => item.url().includes("/api/admin/billing/plans") && item.request().method() === "POST", { timeout: 45_000 });
    await page.getByRole("button", { name: "Luu goi" }).click();
    const createdPlan = await planResponse;
    expect(createdPlan.status(), await createdPlan.text()).toBe(201);
    planId = (await createdPlan.json()).plan.id;
    await expect(page.getByRole("heading", { name: planName })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel("Nguoi dung").locator(`option[value="${member.id}"]`)).toHaveCount(1, { timeout: 30_000 });
    await page.getByLabel("Nguoi dung").selectOption(member.id);
    await page.getByLabel("Goi thanh vien").selectOption(planId);
    const activationResponse = page.waitForResponse((item) => item.url().includes("/api/admin/billing/subscriptions") && item.request().method() === "POST", { timeout: 45_000 });
    await page.getByRole("button", { name: "Cap hoac gia han" }).click();
    expect((await activationResponse).status()).toBe(201);

    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    try {
      await login(memberPage, member);
      await memberPage.goto("/membership");
      await expect(memberPage.getByRole("heading", { name: "Thanh vien hien tai" })).toBeVisible({ timeout: 30_000 });
      const currentMembership = memberPage.locator(".panel").filter({ has: memberPage.getByRole("heading", { name: "Thanh vien hien tai" }) });
      await expect(currentMembership.getByText(planName)).toBeVisible();

      const membershipEntry = page.getByRole("article").filter({ has: page.getByRole("heading", { name: planName }) });
      const suspensionResponse = page.waitForResponse((item) => item.url().includes("/api/admin/billing/subscriptions/") && item.request().method() === "PATCH", { timeout: 45_000 });
      await membershipEntry.getByRole("button", { name: "Dung" }).click();
      expect((await suspensionResponse).status()).toBe(200);
      await memberPage.reload();
      await expect(memberPage.getByRole("heading", { name: "Thanh vien hien tai" })).toHaveCount(0);

      const reactivationResponse = page.waitForResponse((item) => item.url().includes("/api/admin/billing/subscriptions/") && item.request().method() === "PATCH", { timeout: 45_000 });
      await membershipEntry.getByRole("button", { name: "Kich hoat lai" }).click();
      expect((await reactivationResponse).status()).toBe(200);
      await memberPage.reload();
      await expect(memberPage.getByRole("heading", { name: "Thanh vien hien tai" })).toBeVisible({ timeout: 30_000 });
      await expect(currentMembership.getByText(planName)).toBeVisible();

      const endsBeforeRenewal = (await adminClient.from("membership_subscriptions").select("ends_at").eq("plan_id", planId).eq("user_id", member.id).single()).data?.ends_at;
      if (!endsBeforeRenewal) throw new Error("Membership end date was unavailable.");
      await page.getByLabel("Nguoi dung").selectOption(member.id);
      await page.getByLabel("Goi thanh vien").selectOption(planId);
      const renewalResponse = page.waitForResponse((item) => item.url().includes("/api/admin/billing/subscriptions") && item.request().method() === "POST", { timeout: 45_000 });
      await page.getByRole("button", { name: "Cap hoac gia han" }).click();
      expect((await renewalResponse).status()).toBe(200);
      await expect.poll(async () => (await adminClient.from("membership_subscriptions").select("ends_at").eq("plan_id", planId).eq("user_id", member.id).single()).data?.ends_at, { timeout: 20_000 }).not.toBe(endsBeforeRenewal);

      const deleteUsedPlan = page.waitForResponse((item) => item.url().includes(`/api/admin/billing/plans/${planId}`) && item.request().method() === "DELETE", { timeout: 30_000 });
      await membershipEntry.getByRole("button", { name: "Xoa goi" }).click();
      const usedPlanDialog = page.getByRole("dialog", { name: "Xoa goi thanh vien?" });
      await expect(usedPlanDialog).toBeVisible();
      await usedPlanDialog.getByRole("button", { name: "Xac nhan xoa goi" }).click();
      expect((await deleteUsedPlan).status()).toBe(409);

      const disposableCode = `core-disposable-${randomUUID().slice(0, 8)}`;
      const disposableName = `Core Disposable ${randomUUID().slice(0, 8)}`;
      await page.getByLabel("Code").fill(disposableCode);
      await page.getByLabel("Ten goi").fill(disposableName);
      await page.getByLabel("Gia").fill("50000");
      await page.getByLabel("Ma tien te").fill("VND");
      await page.getByLabel("So ngay").fill("7");
      const disposableCreate = page.waitForResponse((item) => item.url().includes("/api/admin/billing/plans") && item.request().method() === "POST", { timeout: 30_000 });
      await page.getByRole("button", { name: "Luu goi" }).click();
      const disposableCreated = await disposableCreate;
      expect(disposableCreated.status()).toBe(201);
      disposablePlanId = (await disposableCreated.json()).plan.id;
      const disposableEntry = page.getByRole("article").filter({ has: page.getByRole("heading", { name: disposableName }) });
      const deleteDisposable = page.waitForResponse((item) => item.url().includes(`/api/admin/billing/plans/${disposablePlanId}`) && item.request().method() === "DELETE", { timeout: 30_000 });
      await disposableEntry.getByRole("button", { name: "Xoa goi" }).click();
      const disposablePlanDialog = page.getByRole("dialog", { name: "Xoa goi thanh vien?" });
      await expect(disposablePlanDialog).toBeVisible();
      await disposablePlanDialog.getByRole("button", { name: "Xac nhan xoa goi" }).click();
      expect((await deleteDisposable).status()).toBe(204);
      disposablePlanId = "";
    } finally { await memberContext.close(); }
  });
});
