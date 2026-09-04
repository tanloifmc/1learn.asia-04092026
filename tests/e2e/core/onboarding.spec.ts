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

    // Wait for redirect to onboarding (because onboarding_completed_at is null)
    await page.waitForURL("**/onboarding");

    // --- STEP 1: Basic Info ---
    await expect(page.getByText("Bước 1 / 4")).toBeVisible();
    await page.fill('input[name="grade"]', "10");
    await page.fill('input[name="region"]', "Hà Nội");
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // --- STEP 2: Academic Info ---
    await expect(page.getByText("Bước 2 / 4")).toBeVisible();
    await page.fill('input[name="strong_subjects"]', "Toán, Lý");
    await page.fill('input[name="weak_subjects"]', "Hóa");
    await page.click('text=Giỏi (Excellent)');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // --- STEP 3: Interests ---
    await expect(page.getByText("Bước 3 / 4")).toBeVisible();
    await page.fill('input[name="interest_areas"]', "Máy tính, Đọc sách");
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // --- STEP 4: Future Goals ---
    await expect(page.getByText("Bước 4 / 4")).toBeVisible();
    await page.click('text=Du học');
    await page.click('text=4'); // Family support level
    await page.getByRole('button', { name: 'Hoàn thành & Bắt đầu' }).click();

    // Wait for redirect to home
    await page.waitForURL("**/home");
    await expect(page.getByText("Tổng quan")).toBeVisible(); // Navigation should say Tổng quan instead of Nhà của tôi

    // --- DB Verification & Reload test ---
    // Reload the page to ensure we stay on /home and don't get kicked back to onboarding
    await page.reload();
    await page.waitForURL("**/home");

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
  });
});
