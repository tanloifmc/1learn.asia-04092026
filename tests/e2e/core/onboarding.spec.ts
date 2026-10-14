import { test, expect } from "@playwright/test";
import { createIsolatedStudent, cleanupIsolatedUser, adminClient } from "../helpers/test-users";

test.describe("Student Onboarding Flow", () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeEach(async () => {
    testUser = await createIsolatedStudent();
  });

  test.afterEach(async () => {
    if (testUser) {
      await cleanupIsolatedUser(testUser.id);
    }
  });

  test("should successfully complete all 4 onboarding steps and persist data", async ({ page }) => {
    test.slow(); // This flow involves multiple DB transactions and animations

    // 1. Log in
    await page.goto("/login");
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect.poll(async () => {
      const cookies = await page.context().cookies(page.url());
      return cookies.filter((cookie) => /^sb-.*-auth-token/.test(cookie.name)).length;
    }, { timeout: 10_000 }).toBeGreaterThan(0);

    // Wait for redirect to onboarding (because onboarding_completed_at is null)
    await page.waitForURL("**/onboarding");

    // --- STEP 1: Basic Info ---
    await expect(page.getByText("Bước 1 / 4")).toBeVisible();
    await page.fill('input[name="display_name"]', "E2E Test Student");
    await page.fill('input[name="birth_year"]', "2008");
    await page.fill('input[name="grade"]', "10");
    await page.fill('input[name="region"]', "Hà Nội");
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // --- STEP 2: Academic Info ---
    await expect(page.getByText("Bước 2 / 4")).toBeVisible();
    await page.fill('input[name="strong_subjects"]', "Toán, Lý");
    await page.fill('input[name="weak_subjects"]', "Hóa");
    await page.locator('input[name="gpa_range"][value="excellent"]').check({ force: true });
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // --- STEP 3: Interests ---
    await expect(page.getByText("Bước 3 / 4")).toBeVisible();
    await page.fill('input[name="interest_areas"]', "Máy tính, Đọc sách");
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // --- STEP 4: Future Goals ---
    await expect(page.getByText("Bước 4 / 4")).toBeVisible();
    await page.locator('input[name="study_location_pref"][value="abroad"]').check({ force: true });
    await page.locator('input[name="family_support_level"][value="4"]').check({ force: true });
    await page.getByRole('button', { name: 'Hoàn thành & Bắt đầu' }).click();

    // The completed student returns to the canonical dashboard route.
    await page.waitForURL("**/dashboard");
    await expect(page.getByText("Tổng quan")).toBeVisible();

    // --- DB Verification & Reload test ---
    // Reload the page to ensure we stay on the dashboard and don't get kicked back to onboarding.
    await page.reload();
    await page.waitForURL("**/dashboard");

    // Verify DB integrity manually via server-side checks
    const { data: profile } = await adminClient
      .from('student_profiles')
      .select('*')
      .eq('id', testUser.id)
      .single();
    
    expect(profile).not.toBeNull();
    expect(profile.onboarding_step).toBe(5);
    expect(profile.onboarding_completed_at).not.toBeNull();
    expect(profile.grade).toBe(10);
    expect(profile.region).toBe("Hà Nội");
    expect(profile.study_location_pref).toBe("abroad");
    expect(profile.family_support_level).toBe(4);

    const { data: academicRecords } = await adminClient
      .from('academic_records')
      .select('*')
      .eq('student_id', testUser.id);
    
    expect(academicRecords?.length).toBe(3); // Toán, Lý (strong), Hóa (weak)

    const { data: interests } = await adminClient
      .from('student_interests')
      .select('*')
      .eq('student_id', testUser.id);
    
    expect(interests?.length).toBe(2); // Máy tính, Đọc sách
    expect(interests![0].interest_area).toBe("Máy tính");
    expect(interests![0].interest_level).toBe(5);

    const { data: onboardingEvents, error: analyticsError } = await adminClient
      .from('analytics_events')
      .select('event_name, event_version, source, properties')
      .eq('user_id', testUser.id)
      .eq('event_name', 'ONBOARDING_COMPLETED');

    expect(analyticsError).toBeNull();
    expect(onboardingEvents).toHaveLength(1);
    expect(onboardingEvents![0]).toMatchObject({
      event_name: 'ONBOARDING_COMPLETED',
      event_version: 'v1',
      source: 'server',
      properties: { grade_level: '10', has_interests: true },
    });
  });
});
