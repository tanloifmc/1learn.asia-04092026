import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("live CMS publishing journey", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(90_000);
  let adminClient: ReturnType<typeof createClient>;
  let editor: { id: string; email: string; password: string };
  let postId = "";

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const password = `CoreCms!${randomUUID()}`;
    const { data, error } = await adminClient.auth.admin.createUser({ email: `core-cms-${randomUUID()}@example.invalid`, email_confirm: true, password, user_metadata: { display_name: "Core CMS Editor" } });
    if (error || !data.user) throw new Error(`Could not create CMS editor: ${error?.message ?? "unknown error"}`);
    editor = { id: data.user.id, email: data.user.email, password };
    await adminClient.from("user_roles").upsert({ user_id: editor.id, role: "editor" }, { onConflict: "user_id,role" });
  });

  test.afterAll(async () => {
    if (postId) await adminClient.from("content_posts").delete().eq("id", postId);
    await adminClient.auth.admin.deleteUser(editor.id);
  });

  async function login(page: import("@playwright/test").Page) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(editor.email);
    await page.getByLabel("Mat khau").fill(editor.password);
    const response = page.waitForResponse((item) => item.url().includes("/auth/v1/token") && item.request().method() === "POST", { timeout: 20_000 });
    await page.getByRole("button", { name: "Dang nhap" }).click();
    expect((await response).ok()).toBe(true);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  }

  test("editor publishes a post that is readable publicly", async ({ browser, page }) => {
    const title = `Core CMS ${randomUUID().slice(0, 8)}`;
    const slug = `core-cms-${randomUUID().slice(0, 8)}`;
    const body = `Noi dung nghiem thu ${randomUUID().slice(0, 8)}`;
    await login(page);
    await page.goto("/admin/content/posts");
    await page.getByLabel("Tieu de").fill(title);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Noi dung").fill(body);
    await page.getByLabel("Trang thai").selectOption("published");
    const createResponse = page.waitForResponse((item) => item.url().includes("/api/admin/content/posts") && item.request().method() === "POST", { timeout: 30_000 });
    await page.getByRole("button", { name: "Luu bai viet" }).click();
    const result = await createResponse;
    expect(result.status(), await result.text()).toBe(201);
    postId = (await result.json()).post.id;

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    try {
      await publicPage.goto(`/blog/${slug}`);
      await expect(publicPage.getByRole("heading", { name: title })).toBeVisible({ timeout: 30_000 });
      await expect(publicPage.getByText(body)).toBeVisible();
    } finally { await publicContext.close(); }
  });
});
