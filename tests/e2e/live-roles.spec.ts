import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("live editor role lifecycle", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(90_000);
  let adminClient: ReturnType<typeof createClient>;
  let administrator: { id: string; email: string; password: string };
  let superAdministrator: { id: string; email: string; password: string };
  let editorCandidate: { id: string; email: string; password: string };
  let editorDisplayName = "";

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    async function createUser(label: string, displayName = `Core ${label}`) { const password = `CoreRoles!${randomUUID()}`; const { data, error } = await adminClient.auth.admin.createUser({ email: `core-roles-${label}-${randomUUID()}@example.invalid`, email_confirm: true, password, user_metadata: { display_name: displayName } }); if (error || !data.user) throw new Error(`Could not create ${label}: ${error?.message ?? "unknown error"}`); return { id: data.user.id, email: data.user.email, password }; }
    administrator = await createUser("admin");
    superAdministrator = await createUser("super-admin");
    editorDisplayName = `Core editor ${randomUUID().slice(0, 8)}`;
    editorCandidate = await createUser("editor", editorDisplayName);
    await adminClient.from("user_roles").upsert({ user_id: administrator.id, role: "admin" }, { onConflict: "user_id,role" });
    await adminClient.from("user_roles").upsert({ user_id: superAdministrator.id, role: "super_admin" }, { onConflict: "user_id,role" });
  });

  test.afterAll(async () => {
    if (editorCandidate) {
      await adminClient.from("audit_logs").delete().eq("entity_id", editorCandidate.id);
      await adminClient.auth.admin.deleteUser(editorCandidate.id);
    }
    if (administrator) await adminClient.auth.admin.deleteUser(administrator.id);
    if (superAdministrator) await adminClient.auth.admin.deleteUser(superAdministrator.id);
  });

  async function login(page: import("@playwright/test").Page, account: { email: string; password: string }) { await page.goto("/login"); await page.getByLabel("Email").fill(account.email); await page.getByLabel("Mat khau").fill(account.password); const response = page.waitForResponse((item) => item.url().includes("/auth/v1/token") && item.request().method() === "POST", { timeout: 20_000 }); await page.getByRole("button", { name: "Dang nhap" }).click(); expect((await response).ok()).toBe(true); await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 }); }

  test("administrator grants and revokes editor access", async ({ browser, page }) => {
    await login(page, administrator);
    await page.goto("/admin/users");
    const userEntry = page.getByRole("article").filter({ has: page.getByRole("heading", { name: editorDisplayName }) });
    await expect(userEntry).toBeVisible({ timeout: 30_000 });
    await expect(userEntry.getByRole("button", { name: "Cap admin" })).toHaveCount(0);
    const unauthorizedAdminGrant = await page.evaluate(async (id) => (await fetch(`/api/admin/users/${id}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "admin", action: "add" }) })).status, editorCandidate.id);
    const unauthorizedProviderGrant = await page.evaluate(async (id) => (await fetch(`/api/admin/users/${id}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "provider", action: "add" }) })).status, editorCandidate.id);
    expect(unauthorizedAdminGrant).toBe(403);
    expect(unauthorizedProviderGrant).toBe(403);
    const grant = page.waitForResponse((item) => item.url().includes(`/api/admin/users/${editorCandidate.id}/role`) && item.request().method() === "PATCH", { timeout: 30_000 });
    await userEntry.getByRole("button", { name: "Cap editor" }).click();
    expect((await grant).status()).toBe(200);

    const editorContext = await browser.newContext();
    const editorPage = await editorContext.newPage();
    try {
      await login(editorPage, editorCandidate);
      await editorPage.goto("/admin/content/posts");
      await expect(editorPage.getByRole("heading", { name: "Bai viet", exact: true })).toBeVisible({ timeout: 30_000 });
      const revoke = page.waitForResponse((item) => item.url().includes(`/api/admin/users/${editorCandidate.id}/role`) && item.request().method() === "PATCH", { timeout: 30_000 });
      await userEntry.getByRole("button", { name: "Thu hoi editor" }).click();
      expect((await revoke).status()).toBe(200);
      await editorPage.goto("/admin/content/posts");
      await expect(editorPage).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
      await page.goto("/admin/audit");
      const auditEntries = page.getByRole("article").filter({ hasText: editorCandidate.id });
      await expect(auditEntries.filter({ has: page.getByRole("heading", { name: "role.add", exact: true }) })).toBeVisible({ timeout: 30_000 });
      await expect(auditEntries.filter({ has: page.getByRole("heading", { name: "role.remove", exact: true }) })).toBeVisible();
      await page.getByLabel("Hanh dong").fill("role.remove");
      await page.getByLabel("Loai doi tuong").fill("user_role");
      const filteredAudit = page.waitForResponse((item) => item.url().includes("/api/admin/audit-logs?") && item.url().includes("action=role.remove") && item.url().includes("entityType=user_role"), { timeout: 30_000 });
      await page.getByRole("button", { name: "Loc", exact: true }).click();
      expect((await filteredAudit).status()).toBe(200);
      await expect(page.getByRole("article").filter({ hasText: editorCandidate.id }).getByRole("heading", { name: "role.remove", exact: true })).toBeVisible();
    } finally { await editorContext.close(); }
  });

  test("super administrator grants and revokes administrator access", async ({ browser, page }) => {
    await login(page, superAdministrator);
    await page.goto("/admin/users");
    const userEntry = page.getByRole("article").filter({ has: page.getByRole("heading", { name: editorDisplayName }) });
    await expect(userEntry).toBeVisible({ timeout: 30_000 });
    const forbiddenProviderGrant = await page.evaluate(async (id) => (await fetch(`/api/admin/users/${id}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "provider", action: "add" }) })).status, editorCandidate.id);
    expect(forbiddenProviderGrant).toBe(403);
    const grant = page.waitForResponse((item) => item.url().includes(`/api/admin/users/${editorCandidate.id}/role`) && item.request().method() === "PATCH" && item.request().postData()?.includes('"role":"admin"'), { timeout: 30_000 });
    await userEntry.getByRole("button", { name: "Cap admin" }).click();
    expect((await grant).status()).toBe(200);

    const administratorContext = await browser.newContext();
    const administratorPage = await administratorContext.newPage();
    try {
      await login(administratorPage, editorCandidate);
      await administratorPage.goto("/admin/users");
      await expect(administratorPage.getByRole("heading", { name: "Nguoi dung va vai tro", exact: true })).toBeVisible({ timeout: 30_000 });
      const revoke = page.waitForResponse((item) => item.url().includes(`/api/admin/users/${editorCandidate.id}/role`) && item.request().method() === "PATCH" && item.request().postData()?.includes('"role":"admin"'), { timeout: 30_000 });
      await userEntry.getByRole("button", { name: "Thu hoi admin" }).click();
      expect((await revoke).status()).toBe(200);
      await administratorPage.goto("/admin/users");
      await expect(administratorPage).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
    } finally {
      await administratorContext.close();
    }
  });
});
