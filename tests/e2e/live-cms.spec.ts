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
  let categoryId = "";
  let pageId = "";
  let settingKey = "";
  let contentMediaPath = "";

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const password = `CoreCms!${randomUUID()}`;
    const { data, error } = await adminClient.auth.admin.createUser({ email: `core-cms-${randomUUID()}@example.invalid`, email_confirm: true, password, user_metadata: { display_name: "Core CMS Editor" } });
    if (error || !data.user) throw new Error(`Could not create CMS editor: ${error?.message ?? "unknown error"}`);
    editor = { id: data.user.id, email: data.user.email, password };
    await adminClient.from("user_roles").upsert({ user_id: editor.id, role: "editor" }, { onConflict: "user_id,role" });
    await adminClient.from("user_roles").upsert({ user_id: editor.id, role: "admin" }, { onConflict: "user_id,role" });
  });

  test.afterAll(async () => {
    if (postId) await adminClient.from("content_posts").delete().eq("id", postId);
    if (pageId) await adminClient.from("content_pages").delete().eq("id", pageId);
    if (categoryId) await adminClient.from("content_categories").delete().eq("id", categoryId);
    if (settingKey) await adminClient.from("app_settings").delete().eq("key", settingKey);
    if (contentMediaPath) await adminClient.storage.from("content-media").remove([contentMediaPath]);
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
    const uploadResponse = page.waitForResponse((item) => item.url().includes("/api/media/upload") && item.request().method() === "POST", { timeout: 30_000 });
    await page.getByRole("heading", { name: "Tai anh CMS" }).locator("..").getByLabel("Chon anh").setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) });
    const uploadResult = await uploadResponse;
    expect(uploadResult.status(), await uploadResult.text()).toBe(201);
    const coverImageUrl = (await uploadResult.json()).url as string;
    contentMediaPath = decodeURIComponent(new URL(coverImageUrl).pathname.split("/content-media/")[1] ?? "");
    expect(contentMediaPath).toMatch(/^uploads\//);
    await expect(page.getByLabel("URL anh bia")).toHaveValue(coverImageUrl);
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
      await expect(publicPage.locator("img").first()).toHaveAttribute("src", coverImageUrl);
      await expect(publicPage.getByText(body)).toBeVisible();
    } finally { await publicContext.close(); }

    await page.goto("/admin/content/posts");
    const postEntry = page.getByRole("article").filter({ has: page.getByRole("heading", { name: title }) });
    await expect(postEntry).toBeVisible({ timeout: 30_000 });
    const archivePost = page.waitForResponse((item) => item.url().includes(`/api/admin/content/posts/${postId}`) && item.request().method() === "DELETE", { timeout: 30_000 });
    await postEntry.getByRole("button", { name: "Luu tru" }).click();
    const postArchiveDialog = page.getByRole("dialog", { name: "Luu tru bai viet?" });
    await expect(postArchiveDialog).toBeVisible();
    await postArchiveDialog.getByRole("button", { name: "Xac nhan luu tru" }).click();
    expect((await archivePost).status()).toBe(204);
    await expect(postEntry.getByText(`${slug} | archived`)).toBeVisible();
    const archivedPublic = await page.request.get(`/blog/${slug}`);
    expect(archivedPublic.status()).toBe(404);
  });

  test("editor creates a category and publishes a static page", async ({ browser, page }) => {
    const categoryName = `Core Category ${randomUUID().slice(0, 8)}`;
    const categorySlug = `core-category-${randomUUID().slice(0, 8)}`;
    const title = `Core Page ${randomUUID().slice(0, 8)}`;
    const slug = `core-page-${randomUUID().slice(0, 8)}`;
    const body = `Noi dung trang tinh ${randomUUID().slice(0, 8)}`;
    await login(page);

    await page.goto("/admin/content/categories");
    await page.getByLabel("Ten").fill(categoryName);
    await page.getByLabel("Slug").fill(categorySlug);
    const categoryResponse = page.waitForResponse((item) => item.url().includes("/api/admin/content/categories") && item.request().method() === "POST", { timeout: 30_000 });
    await page.getByRole("button", { name: "Luu danh muc" }).click();
    const categoryResult = await categoryResponse;
    expect(categoryResult.status(), await categoryResult.text()).toBe(201);
    categoryId = (await categoryResult.json()).category.id;

    await page.goto("/admin/content/pages");
    await page.getByLabel("Tieu de").fill(title);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Noi dung").fill(body);
    await page.getByLabel("Trang thai").selectOption("published");
    const pageResponse = page.waitForResponse((item) => item.url().includes("/api/admin/content/pages") && item.request().method() === "POST", { timeout: 30_000 });
    await page.getByRole("button", { name: "Luu trang" }).click();
    const pageResult = await pageResponse;
    expect(pageResult.status(), await pageResult.text()).toBe(201);
    pageId = (await pageResult.json()).page.id;

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    try {
      await publicPage.goto(`/pages/${slug}`);
      await expect(publicPage.getByRole("heading", { name: title })).toBeVisible({ timeout: 30_000 });
      await expect(publicPage.getByText(body)).toBeVisible();
    } finally { await publicContext.close(); }

    await page.goto("/admin/content/pages");
    const staticPageEntry = page.getByRole("article").filter({ has: page.getByRole("heading", { name: title }) });
    await expect(staticPageEntry).toBeVisible({ timeout: 30_000 });
    const archivePage = page.waitForResponse((item) => item.url().includes(`/api/admin/content/pages/${pageId}`) && item.request().method() === "DELETE", { timeout: 30_000 });
    await staticPageEntry.getByRole("button", { name: "Luu tru" }).click();
    const pageArchiveDialog = page.getByRole("dialog", { name: "Luu tru trang tinh?" });
    await expect(pageArchiveDialog).toBeVisible();
    await pageArchiveDialog.getByRole("button", { name: "Xac nhan luu tru" }).click();
    expect((await archivePage).status()).toBe(204);
    await expect(staticPageEntry.getByText(`/pages/${slug} | archived`)).toBeVisible();
    const archivedPublic = await page.request.get(`/pages/${slug}`);
    expect(archivedPublic.status()).toBe(404);
  });

  test("administrator saves an isolated public setting", async ({ page }) => {
    settingKey = `core_setting_${randomUUID().replaceAll("-", "")}`;
    const value = `Core setting ${randomUUID().slice(0, 8)}`;
    await login(page);
    await page.goto("/admin/settings");
    await page.getByLabel("Key").fill(settingKey);
    await page.getByLabel("Gia tri JSON").fill(JSON.stringify({ value }));
    await page.getByLabel("Cho phep doc cong khai").check();
    const settingResponse = page.waitForResponse((item) => item.url().includes("/api/admin/settings") && item.request().method() === "PATCH", { timeout: 30_000 });
    await page.getByRole("button", { name: "Luu cau hinh" }).click();
    const result = await settingResponse;
    expect(result.status(), await result.text()).toBe(200);
    await expect(page.getByText("Da luu cau hinh. Tai lai trang de xem du lieu moi.", { exact: true })).toBeVisible();
    await expect.poll(async () => {
      const [{ data: setting }, { data: audit }] = await Promise.all([
        adminClient.from("app_settings").select("value, is_public").eq("key", settingKey).maybeSingle(),
        adminClient.from("audit_logs").select("action").eq("entity_type", "app_setting").eq("entity_id", settingKey),
      ]);
      return setting?.is_public === true && setting.value?.value === value && audit?.some(({ action }) => action === "setting.updated");
    }, { timeout: 20_000 }).toBe(true);
    await page.goto("/admin/audit");
    await expect(page.getByText(settingKey, { exact: false })).toBeVisible({ timeout: 30_000 });
  });
});
