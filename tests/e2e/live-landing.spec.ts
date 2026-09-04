import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

test.describe("Landing Page Lead Capture", () => {
  test("guest can submit email to receive early access info", async ({ page }) => {
    // Arrange
    await page.goto("/");
    const formHeading = page.getByRole("heading", { name: "Đăng ký nhận thông tin sớm" });
    await expect(formHeading).toBeVisible();

    // Act
    const testEmail = `lead-${randomUUID().slice(0, 8)}@example.invalid`;
    const testName = "Nguyen Van Test";
    
    await page.getByLabel("Họ và tên").fill(testName);
    await page.getByLabel("Email").fill(testEmail);
    
    await page.getByRole("button", { name: "Đăng ký ngay" }).click();

    // Assert
    const successMsg = page.getByText("Đăng ký thành công! Vui lòng kiểm tra email của bạn.");
    await expect(successMsg).toBeVisible({ timeout: 10_000 });
  });

  test("guest sees duplicate error message if submitting twice", async ({ page }) => {
    // Arrange
    await page.goto("/");
    const testEmail = `duplicate-${randomUUID().slice(0, 8)}@example.invalid`;
    
    // First submit
    await page.getByLabel("Họ và tên").fill("Test Duplicate");
    await page.getByLabel("Email").fill(testEmail);
    await page.getByRole("button", { name: "Đăng ký ngay" }).click();
    await expect(page.getByText("Đăng ký thành công! Vui lòng kiểm tra email của bạn.")).toBeVisible({ timeout: 10_000 });
    
    // Second submit with same email
    await page.reload();
    await page.getByLabel("Họ và tên").fill("Test Duplicate");
    await page.getByLabel("Email").fill(testEmail);
    await page.getByRole("button", { name: "Đăng ký ngay" }).click();

    // Assert
    const duplicateMsg = page.getByText("Bạn đã đăng ký trước đó. Cảm ơn bạn!");
    await expect(duplicateMsg).toBeVisible({ timeout: 10_000 });
  });
});
