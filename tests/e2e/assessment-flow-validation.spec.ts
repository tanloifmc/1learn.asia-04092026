import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("Assessment Flow & Resume Validation", () => {
  test.skip(!enabled, "Set RUN_LIVE_BROWSER_AUTH=true to run this live acceptance suite.");
  test.setTimeout(300_000);

  let userId: string | null = null;
  let email = "";
  let password = "";
  let admin: ReturnType<typeof createClient>;
  let versionId: string;
  let sessionId: string;
  let allQuestions: any[] = [];

  test.beforeAll(async () => {
    if (!url || !serviceRoleKey) throw new Error("Live Supabase configuration is required.");
    admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    password = `TestStudent!${randomUUID()}`;
    email = `student-${randomUUID()}@example.invalid`;
    
    // Create student
    const { data, error } = await admin.auth.admin.createUser({ 
      email, email_confirm: true, password, user_metadata: { role: 'student' }
    });
    if (error || !data.user) throw new Error("Could not create student test user");
    userId = data.user.id;

    // Get the published version ID
    const { data: version } = await admin
      .from('assessment_versions')
      .select('id')
      .eq('status', 'published')
      .single() as any;
    if (!version) throw new Error("No published version found.");
    versionId = version.id;

    const { data: qData } = await admin.from('assessment_questions').select('id, question_code').eq('version_id', versionId).order('order_index');
    allQuestions = qData || [];
  });

  test.afterAll(async () => {
    if (!userId) return;
    await admin.auth.admin.deleteUser(userId);
  });

  test("student can start, pause, resume, and complete assessment", async ({ page }) => {
    // 1. Login
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // 2. Go to Assessments list and start
    await page.goto("/assessment");
    await page.getByRole("link", { name: /Bắt đầu ngay/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/assessment/${versionId}/session`), { timeout: 30000 });

    // 3. Verify section UI (Module Name)
    await expect(page.getByText("Khám phá Tính cách", { exact: false }).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Câu 1 /")).toBeVisible({ timeout: 15000 });

    // 4. Answer Q1 & Q2
    await page.locator('.max-w-2xl button').first().click();
    await expect(page.getByText("Câu 2 /")).toBeVisible();
    await page.locator('.max-w-2xl button').first().click();
    await expect(page.getByText("Câu 3 /")).toBeVisible();

    // 5. Test Resume Flow (Reload page)
    await page.reload();
    await expect(page.getByText("Câu 3 /")).toBeVisible(); // Should jump directly to Q3 (first unanswered)

    // Verify Q2 can be accessed via Back button and has "Tiếp tục" button
    await page.getByRole('button', { name: /Quay lại/ }).click();
    await expect(page.getByText("Câu 2 /")).toBeVisible();
    await expect(page.getByRole('button', { name: /Tiếp tục/ })).toBeVisible();
    await page.getByRole('button', { name: /Tiếp tục/ }).click();
    await expect(page.getByText("Câu 3 /")).toBeVisible();

    // 6. Fast-forward by answering remaining questions via UI (up to Q120)
    // We start from index 2 (which is Q3, since we answered Q1 and Q2)
    // and go up to length - 2 (Q120). We leave Q121 unanswered.
    for (let i = 2; i < allQuestions.length - 1; i++) {
      // Click the first option
      await page.locator('.max-w-2xl button').first().click();
      // Wait for the next question to load
      await expect(page.getByText(`Câu ${i + 2} /`)).toBeVisible();
    }

    // 7. Reload and verify it resumes at the very last question (Q121)
    await page.reload();
    await expect(page.getByText(`Câu ${allQuestions.length} /`)).toBeVisible();

    // 8. Submit successfully
    await page.locator('.max-w-2xl button').first().click(); // Answer the last question
    const submitBtn = page.getByRole("button", { name: "Hoàn thành bài test" });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 9. Verify redirection and DB state
    await expect(page).toHaveURL(/\/me\/bao-cao/, { timeout: 15_000 });
    
    // We need sessionId to verify DB, so fetch it here
    const { data: sessionData } = await admin.from('assessment_sessions').select('id, status').eq('student_id', userId as string).single() as any;
    expect(sessionData?.status).toBe('completed');
  });
});
