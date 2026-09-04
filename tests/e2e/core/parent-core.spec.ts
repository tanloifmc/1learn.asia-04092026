import { test, expect } from "@playwright/test";
import { createIsolatedParent, createIsolatedStudent, cleanupIsolatedUser, adminClient } from "../helpers/test-users";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";

test.describe("Parent Core Flows", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run E2E suites.");
  test.setTimeout(120_000);

  let parent: { id: string; email: string; password: string };
  let student: { id: string; email: string; password: string };
  let linkCode = "";

  test.beforeEach(async () => {
    parent = await createIsolatedParent();
    student = await createIsolatedStudent();

    // Setup: Create an active link code for the student
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    linkCode = code;
    
    await adminClient.from('parent_student_links').insert({
      parent_id: null,
      student_id: student.id,
      link_code: code,
      status: 'pending',
      permission_level: 1, // 1 = overview
      expires_at: new Date(Date.now() + 86400000).toISOString()
    });
  });

  test.afterEach(async () => {
    if (parent?.id) await cleanupIsolatedUser(parent.id);
    if (student?.id) await cleanupIsolatedUser(student.id);
  });

  test("Parent Link, Privacy, and Revoke Flow", async ({ page }) => {
    // 1. Parent Login
    await page.goto("/login");
    await page.getByLabel("Email").fill(parent.email);
    await page.getByLabel("Mật khẩu").fill(parent.password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    // 2. Link Code Entry
    await expect(page).toHaveURL(/\/parent/);
    await page.getByPlaceholder("Nhập mã kết nối").fill(linkCode);
    await page.getByRole("button", { name: "Kết nối" }).click();

    // Verify Link Success
    await expect(page.getByText(/Thành công|Đã kết nối/i)).toBeVisible();

    // 3. Parent Dashboard (Privacy Check)
    await page.goto(`/parent/child/${student.id}`);
    
    // Privacy Test: Parent (Level 1) should NOT see raw answers or detailed tasks
    // They should see an overview.
    await expect(page.getByText("Hồ sơ học tập")).toBeVisible();
    
    // Attempting to visit restricted API or page should fail or show restricted message
    // (We simulate this by checking that restricted sections are not rendered)
    await expect(page.getByText("Chi tiết bài làm")).not.toBeVisible();

    // 4. Revoke Flow
    // Instead of doing it from the UI, we simulate the student revoking it from their dashboard
    // via database state change, then verify the parent loses access immediately.
    await adminClient.from('parent_student_links')
      .update({ status: 'revoked' })
      .eq('student_id', student.id)
      .eq('parent_id', parent.id);

    // Parent reloads the page
    await page.reload();
    
    // Should be denied or redirected
    await expect(page.getByText(/Không có quyền truy cập|Đã bị thu hồi/i)).toBeVisible();
  });
});
