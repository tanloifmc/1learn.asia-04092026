import { test, expect } from "@playwright/test";
import { createIsolatedStudent, cleanupIsolatedUser, assertAssessmentCompleted, assertGoalCreated } from "../helpers/test-users";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";

test.describe("Student Core Flows", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run E2E suites.");
  test.setTimeout(120_000);

  let student: { id: string; email: string; password: string };

  test.beforeEach(async () => {
    student = await createIsolatedStudent();
  });

  test.afterEach(async () => {
    if (student?.id) {
      await cleanupIsolatedUser(student.id);
    }
  });

  test("Happy Path: New User -> Onboarding -> Assessment -> Goal", async ({ page }) => {
    // 1. Login (simulating immediately after register/onboarding redirect)
    await page.goto("/login");
    await page.getByLabel("Email").fill(student.email);
    await page.getByLabel("Mật khẩu").fill(student.password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    // 2. Dashboard / Home
    await expect(page).toHaveURL(/\/home|\/me/);
    
    // 3. Assessment Page (Khám Phá)
    await page.getByRole("link", { name: "Khám phá bản thân" }).click();
    await expect(page).toHaveURL(/\/me\/kham-pha/);
    await page.getByRole("button", { name: /Bắt đầu|Làm lại/i }).first().click();

    // Answer RIASEC questions (we assume RIASEC V1 has multiple pages, just click answers)
    // For idempotency and speed, we intercept or just answer a few and click Next until done.
    // In a real E2E we'd click through all of them. Here we simulate completing the UI.
    while (await page.getByRole("button", { name: "Tiếp tục" }).isVisible()) {
      // Pick the first answer option for each question on the screen
      const options = page.locator('input[type="radio"]');
      const count = await options.count();
      for (let i = 0; i < count; i += 5) { // Assuming 5 options per question (Likert)
        await options.nth(i).click();
      }
      await page.getByRole("button", { name: "Tiếp tục" }).click();
    }
    
    // Submit
    const submitBtn = page.getByRole("button", { name: "Hoàn thành" });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Idempotency check: double click should not crash
    await submitBtn.click({ force: true }).catch(() => {}); // Optional second click to test idempotency

    // 4. Report
    await expect(page).toHaveURL(/\/me\/kham-pha\/report/);
    await expect(page.getByText("Kết quả RIASEC")).toBeVisible();

    // -> Business State Checkpoint 1
    await assertAssessmentCompleted(student.id);

    // 5. Explore
    await page.getByRole("link", { name: "Khám phá nghề nghiệp" }).click();
    await expect(page).toHaveURL(/\/explore/);
    
    // We expect some recommendations to appear
    await expect(page.locator(".career-card").first()).toBeVisible();

    // 6. Set Goal
    await page.locator(".career-card").first().click();
    await page.getByRole("button", { name: "Đặt làm mục tiêu" }).click();

    // -> Business State Checkpoint 2
    await assertGoalCreated(student.id);
  });

  test("Returning User Path: Login -> Home -> Resume", async ({ page }) => {
    // Setup: the returning user must already have a goal/roadmap.
    // We will assume they login and see their active roadmap.
    await page.goto("/login");
    await page.getByLabel("Email").fill(student.email);
    await page.getByLabel("Mật khẩu").fill(student.password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page).toHaveURL(/\/home/);
    
    // Check for Roadmap / Journey widget
    const journeyLink = page.getByRole("link", { name: /Hành trình|Lộ trình/i });
    await expect(journeyLink).toBeVisible();
  });

  test("Negative Flow: Missing Goal Requirement", async ({ page }) => {
    // Attempting to view Compare or Roadmap without goal/data
    await page.goto("/login");
    await page.getByLabel("Email").fill(student.email);
    await page.getByLabel("Mật khẩu").fill(student.password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await page.goto("/explore/compare");
    // Should show empty state or redirect
    await expect(page.getByText(/Chưa có|Không tìm thấy/i)).toBeVisible();
  });
});
