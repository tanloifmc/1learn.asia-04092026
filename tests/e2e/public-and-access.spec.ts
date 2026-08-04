import { expect, test } from "@playwright/test";

test("public shell renders and has no horizontal overflow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Core Platform" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Dieu huong chinh" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dang nhap" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Core Platform" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Dieu huong chan trang" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("protected routes deny anonymous visitors", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Dang nhap" })).toBeVisible();

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});

test("login form exposes accessible shared controls", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Dang nhap" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Mat khau")).toBeVisible();
  await expect(page.getByRole("button", { name: "Dang nhap" })).toBeVisible();
});
