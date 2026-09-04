import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const settingKeys = ["branding", "header_navigation", "footer_navigation", "social_links"] as const;

type PublicSetting = {
  key: typeof settingKeys[number];
  value: unknown;
  is_public: boolean;
};

test.describe("live branding and navigation settings", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(120_000);
  let admin: ReturnType<typeof createClient>;
  let administrator: { id: string; email: string; password: string } | undefined;
  let originalSettings: PublicSetting[] = [];

  test.beforeAll(async () => {
    if (!url || !publicKey || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: settings, error: settingsError } = await admin
      .from("app_settings")
      .select("key, value, is_public")
      .in("key", settingKeys);
    if (settingsError) throw new Error(`Could not snapshot public settings: ${settingsError.message}`);
    originalSettings = (settings ?? []) as PublicSetting[];

    const password = `CoreBranding!${randomUUID()}`;
    const { data, error } = await admin.auth.admin.createUser({
      email: `core-branding-${randomUUID()}@example.invalid`,
      email_confirm: true,
      password,
    });
    if (error || !data.user) throw new Error(`Could not create administrator: ${error?.message ?? "unknown error"}`);
    administrator = { id: data.user.id, email: data.user.email as string, password };
    const { error: roleError } = await (admin as any).from("user_roles").upsert({ user_id: administrator.id, role: "admin" }, { onConflict: "user_id,role" });
    if (roleError) throw new Error(`Could not assign administrator role: ${roleError.message}`);
  });

  test.afterAll(async () => {
    if (!admin) return;
    const originals = new Map(originalSettings.map((setting) => [setting.key, setting]));
    for (const key of settingKeys) {
      const original = originals.get(key);
      if (original) {
        await (admin as any).from("app_settings").upsert({
          key: original.key,
          value: original.value,
          is_public: original.is_public,
        });
      } else {
        await (admin as any).from("app_settings").delete().eq("key", key);
      }
    }
    if (administrator) {
      await (admin as any).from("audit_logs").delete().eq("actor_user_id", administrator.id);
      await admin.auth.admin.deleteUser(administrator.id);
    }
  });

  async function login(page: import("@playwright/test").Page) {
    if (!administrator) throw new Error("Administrator test fixture is not available.");
    await page.goto("/login");
    await page.getByLabel("Email").fill(administrator.email);
    await page.getByLabel("Mat khau").fill(administrator.password);
    const response = page.waitForResponse((item) => item.url().includes("/auth/v1/token") && item.request().method() === "POST", { timeout: 20_000 });
    await page.getByRole("button", { name: "Dang nhap" }).click();
    expect((await response).ok()).toBe(true);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  }

  test("administrator publishes branding and navigation to the public layout", async ({ browser, page }) => {
    const suffix = randomUUID().slice(0, 8);
    const appName = `Core Runtime ${suffix}`;
    const headerLabel = `Core Header ${suffix}`;
    const footerLabel = `Core Footer ${suffix}`;
    const socialLabel = `Core Social ${suffix}`;
    const savedResponses: number[] = [];

    await login(page);
    await page.goto("/admin/settings");
    await page.getByLabel("Ten ung dung").fill(appName);
    await page.getByLabel("Header links").fill(`${headerLabel} | /pricing`);
    await page.getByLabel("Footer links").fill(`${footerLabel} | /contact`);
    await page.getByLabel("Social links").fill(`${socialLabel} | https://example.com/${suffix}`);
    page.on("response", (response) => {
      if (response.url().includes("/api/admin/settings") && response.request().method() === "PATCH") savedResponses.push(response.status());
    });
    await page.getByRole("button", { name: "Luu branding va menu" }).click();
    await expect(page.getByRole("status")).toHaveText("Da luu branding va navigation.");
    await expect.poll(() => savedResponses.length, { timeout: 20_000 }).toBe(4);
    expect(savedResponses.every((status) => status === 200)).toBe(true);
    const publicClient = createClient(url!, publicKey!, { auth: { autoRefreshToken: false, persistSession: false } });
    await expect.poll(async () => {
      const { data } = await publicClient.from("app_settings").select("key, value").eq("is_public", true).in("key", settingKeys);
      const values = new Map(data?.map((setting) => [setting.key, setting.value]) ?? []);
      return values.get("branding");
    }, { timeout: 20_000 }).toEqual({ appName });

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    try {
      await publicPage.goto(`/?branding=${suffix}`);
      await expect(publicPage.getByRole("banner").getByRole("link", { name: appName })).toBeVisible({ timeout: 30_000 });
      await expect(publicPage.getByRole("navigation", { name: "Dieu huong chinh" }).getByRole("link", { name: headerLabel })).toHaveAttribute("href", "/pricing");
      const footer = publicPage.getByRole("contentinfo");
      await expect(footer.getByText(appName, { exact: true })).toBeVisible();
      await expect(footer.getByRole("navigation", { name: "Dieu huong chan trang" }).getByRole("link", { name: footerLabel })).toHaveAttribute("href", "/contact");
      await expect(footer.getByRole("link", { name: socialLabel })).toHaveAttribute("href", `https://example.com/${suffix}`);
    } finally {
      await publicContext.close();
    }
  });
});


