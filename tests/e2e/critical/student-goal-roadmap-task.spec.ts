import { expect, test } from "@playwright/test";
import { adminClient, cleanupIsolatedUser, createIsolatedStudent } from "../helpers/test-users";

async function completeOnboarding(page: import("@playwright/test").Page) {
  await page.fill('input[name="display_name"]', "E2E Roadmap Student");
  await page.fill('input[name="birth_year"]', "2008");
  await page.fill('input[name="grade"]', "10");
  await page.fill('input[name="region"]', "Hà Nội");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.fill('input[name="strong_subjects"]', "Toán");
  await page.fill('input[name="weak_subjects"]', "Hóa");
  await page.locator('input[name="gpa_range"][value="excellent"]').check({ force: true });
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.fill('input[name="interest_areas"]', "Kinh doanh");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.locator('input[name="study_location_pref"][value="abroad"]').check({ force: true });
  await page.locator('input[name="family_support_level"][value="4"]').check({ force: true });
  await page.getByRole("button", { name: "Hoàn thành & Bắt đầu" }).click();
  await page.waitForURL("**/dashboard");
}

test.describe("Critical student goal, roadmap, and task", () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeEach(async () => { testUser = await createIsolatedStudent(); });
  test.afterEach(async () => { if (testUser) await cleanupIsolatedUser(testUser.id); });

  test("uses verified program requirements to create and complete a roadmap task", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/login");
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/onboarding");
    await completeOnboarding(page);

    await page.goto("/majors/cu-nhan-kinh-doanh-rmit");
    await expect(page.getByRole("heading", { name: "Cử nhân Kinh doanh" })).toBeVisible();
    await page.getByRole("button", { name: "Chọn làm Mục tiêu ưu tiên" }).click();
    await page.waitForURL("**/goal", { timeout: 45_000 });

    const { data: goal, error: goalError } = await adminClient
      .from("student_goals").select("id, major_id, is_primary, status")
      .eq("student_id", testUser.id).eq("is_primary", true).single();
    expect(goalError).toBeNull();
    expect(goal?.status).toBe("active");

    const { data: roadmap, error: roadmapError } = await adminClient
      .from("roadmaps").select("id, status, target_major_id, roadmap_milestones(id, roadmap_tasks(id, status))")
      .eq("student_id", testUser.id).eq("status", "active").single();
    expect(roadmapError).toBeNull();
    expect(roadmap?.target_major_id).toBe(goal?.major_id);
    expect(roadmap?.roadmap_milestones.length).toBeGreaterThan(0);
    expect(roadmap?.roadmap_milestones[0].roadmap_tasks.length).toBeGreaterThan(0);

    await page.goto("/roadmap");
    await expect(page.getByRole("heading", { name: "Tiến độ hành trình" })).toBeVisible();
    await page.getByRole("button", { name: /Hoàn thành: Xây dựng nền tảng/ }).first().click();
    await expect.poll(async () => {
      const taskId = roadmap!.roadmap_milestones[0].roadmap_tasks[0].id;
      const { data } = await adminClient.from("roadmap_tasks").select("status, completed_at").eq("id", taskId).single();
      return data;
    }, { timeout: 30_000 }).toMatchObject({ status: "completed" });
  });
});
