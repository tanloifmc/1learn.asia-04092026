import { test, expect } from "@playwright/test";
import { adminClient, cleanupIsolatedUser, createIsolatedStudent } from "../helpers/test-users";

const moduleTitles: Record<string, string> = {
  riasec: "Sở thích nghề nghiệp",
  big_five: "Tính cách cá nhân",
  work_values: "Giá trị nghề nghiệp",
  career_readiness: "Mức độ sẵn sàng",
  validity: "Câu hỏi kiểm tra",
};

type Question = {
  question_code: string;
  module: keyof typeof moduleTitles;
  order_index: number;
};

async function completeOnboarding(page: import("@playwright/test").Page) {
  await page.fill('input[name="display_name"]', "E2E Assessment Student");
  await page.fill('input[name="birth_year"]', "2008");
  await page.fill('input[name="grade"]', "10");
  await page.fill('input[name="region"]', "Hà Nội");
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  await page.fill('input[name="strong_subjects"]', "Toán, Lý");
  await page.fill('input[name="weak_subjects"]', "Hóa");
  await page.locator('input[name="gpa_range"][value="excellent"]').check({ force: true });
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  await page.fill('input[name="interest_areas"]', "Máy tính, Đọc sách");
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  await page.locator('input[name="study_location_pref"][value="abroad"]').check({ force: true });
  await page.locator('input[name="family_support_level"][value="4"]').check({ force: true });
  await page.getByRole("button", { name: "Hoàn thành & Bắt đầu" }).click();
  await page.waitForURL("**/dashboard");
}

test.describe("Critical student assessment and free report", () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeEach(async () => {
    testUser = await createIsolatedStudent();
  });

  test.afterEach(async () => {
    if (testUser) await cleanupIsolatedUser(testUser.id);
  });

  test("a student completes the published assessment and receives a free report", async ({ page }) => {
    test.setTimeout(300_000);

    const { data: version, error: versionError } = await adminClient
      .from("assessment_versions")
      .select("id, config")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    expect(versionError).toBeNull();
    expect(version).not.toBeNull();

    const { data: questions, error: questionsError } = await adminClient
      .from("assessment_questions")
      .select("question_code, module, order_index, assessment_dimensions!inner(matching_role)")
      .eq("version_id", version!.id)
      .order("order_index", { ascending: true });
    expect(questionsError).toBeNull();
    expect(questions?.length).toBeGreaterThan(0);

    const expectedAnswers = ((version!.config as { validity_rules?: { expected_answers?: Record<string, number> } })
      .validity_rules?.expected_answers) ?? {};

    await page.goto("/login");
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect.poll(async () => {
      const cookies = await page.context().cookies(page.url());
      return cookies.filter((cookie) => /^sb-.*-auth-token/.test(cookie.name)).length;
    }, { timeout: 10_000 }).toBeGreaterThan(0);
    await page.waitForURL("**/onboarding");
    await completeOnboarding(page);

    await page.goto("/me/kham-pha");
    await expect(page.getByText("Khám phá Bản thân")).toBeVisible();

    // The isolated session is backdated only to cover the production validity
    // rule for a non-speeding student without making the test wait ten minutes.
    const { error: timingError } = await adminClient
      .from("assessment_sessions")
      .update({ started_at: new Date(Date.now() - 11 * 60 * 1000).toISOString() })
      .eq("student_id", testUser.id)
      .eq("version_id", version!.id)
      .eq("status", "in_progress");
    expect(timingError).toBeNull();

    for (const [module, title] of Object.entries(moduleTitles)) {
      const moduleQuestions = (questions as Question[]).filter(question => question.module === module);
      if (moduleQuestions.length === 0) continue;

      await page.getByRole("button", { name: new RegExp(`^${title}`) }).click();
      for (const question of moduleQuestions) {
        const answer = expectedAnswers[question.question_code] ?? ((question.order_index % 5) + 1);
        const answerButton = page.getByRole("button", {
          name: `Câu ${question.question_code}, đáp án ${answer}`,
          exact: true,
        });
        await answerButton.click();
        await expect(answerButton).toBeEnabled();
      }
    }

    await expect(page.getByText(`${questions!.length} / ${questions!.length} câu`)).toBeVisible();
    await page.getByRole("button", { name: /Hoàn tất & Xem kết quả/ }).click();
    await page.waitForURL("**/me/bao-cao", { timeout: 60_000 });

    const { data: session, error: sessionError } = await adminClient
      .from("assessment_sessions")
      .select("id, status")
      .eq("student_id", testUser.id)
      .eq("version_id", version!.id)
      .single();
    expect(sessionError).toBeNull();
    expect(session?.status).toBe("completed");

    const { data: result, error: resultError } = await adminClient
      .from("assessment_results")
      .select("id, confidence, completion_quality")
      .eq("student_id", testUser.id)
      .eq("session_id", session!.id)
      .single();
    expect(resultError).toBeNull();
    expect(result?.confidence).toMatchObject({ is_usable: true });

    await expect.poll(async () => {
      const { data: report } = await adminClient
        .from("student_reports")
        .select("id")
        .eq("student_id", testUser.id)
        .eq("assessment_result_id", result!.id)
        .maybeSingle();
      return report?.id ?? null;
    }, { timeout: 90_000 }).not.toBeNull();

    const { data: report, error: reportError } = await adminClient
      .from("student_reports")
      .select("id, assessment_result_id, report_data")
      .eq("student_id", testUser.id)
      .eq("assessment_result_id", result!.id)
      .single();
    expect(reportError).toBeNull();
    expect(report?.report_data).toHaveProperty("base");
    const freeCareerMatches = (report?.report_data as { base?: { careerMatches?: unknown[] } }).base?.careerMatches;
    expect(freeCareerMatches).toHaveLength(1);

    const { data: matchRun, error: matchRunError } = await adminClient
      .from("match_runs")
      .select("status, insufficient_reason")
      .eq("student_id", testUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    expect(matchRunError).toBeNull();
    expect(matchRun?.status).toBe("completed");

    await page.reload();
    await expect(page.getByText("Báo cáo Khám phá Bản thân · Miễn phí")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nghề nghiệp có thể phù hợp" })).toBeVisible();

    // The payment webhook is covered in the dedicated payment test. Here we
    // create the test user's real active subscription to verify the protected
    // Premium-report generation path from this completed assessment.
    const { data: premiumPlan, error: premiumPlanError } = await adminClient
      .from("membership_plans")
      .select("id")
      .eq("is_active", true)
      .order("price_amount", { ascending: false })
      .limit(1)
      .single();
    expect(premiumPlanError).toBeNull();

    const { error: subscriptionError } = await adminClient
      .from("membership_subscriptions")
      .insert({
        user_id: testUser.id,
        plan_id: premiumPlan!.id,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      });
    expect(subscriptionError).toBeNull();

    await page.goto("/me/bao-cao/premium");
    await expect(page.getByRole("heading", { name: "Tạo Báo cáo Premium" })).toBeVisible();
    await page.getByRole("button", { name: "Tạo báo cáo Premium" }).click();
    await expect(page.getByRole("heading", { name: "Báo Cáo Định Hướng Nghề Nghiệp" })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText("Lộ trình: Nghề nghiệp → Ngành học → Trường Đại học")).toBeVisible();
    await expect(page.getByRole("button", { name: "Đặt làm mục tiêu" }).first()).toBeVisible();

    const { data: premiumSnapshot, error: premiumSnapshotError } = await adminClient
      .from("student_reports")
      .select("report_type, report_data")
      .eq("student_id", testUser.id)
      .eq("assessment_result_id", result!.id)
      .eq("report_type", "premium")
      .single();
    expect(premiumSnapshotError).toBeNull();
    const premiumPayload = premiumSnapshot?.report_data as {
      premium?: { careerCatalogStatus?: string; careerChain?: unknown[] };
    };
    expect(premiumPayload.premium?.careerCatalogStatus).toBe("available");
    expect(premiumPayload.premium?.careerChain).toHaveLength(1);

    // The selection is made from an actual verified program card, not only
    // from a career. This must create a plan tied to the program requirements.
    await page.getByRole("button", { name: "Đặt làm mục tiêu" }).first().click();
    await page.waitForURL("**/roadmap", { timeout: 60_000 });

    const { data: goal, error: goalError } = await adminClient
      .from("student_goals")
      .select("career_id, major_id, university_id, is_primary, status")
      .eq("student_id", testUser.id)
      .eq("is_primary", true)
      .single();
    expect(goalError).toBeNull();
    expect(goal).toMatchObject({ is_primary: true, status: "active" });
    expect(goal?.career_id).not.toBeNull();
    expect(goal?.major_id).not.toBeNull();
    expect(goal?.university_id).not.toBeNull();

    const { data: roadmap, error: roadmapError } = await adminClient
      .from("roadmaps")
      .select("id, target_career_id, target_major_id, target_university_id, target_program_id, roadmap_milestones(id, roadmap_tasks(id, status))")
      .eq("student_id", testUser.id)
      .eq("status", "active")
      .single();
    expect(roadmapError).toBeNull();
    expect(roadmap?.target_career_id).toBe(goal?.career_id);
    expect(roadmap?.target_major_id).toBe(goal?.major_id);
    expect(roadmap?.target_university_id).toBe(goal?.university_id);
    expect(roadmap?.target_program_id).not.toBeNull();
    expect(roadmap?.roadmap_milestones.length).toBeGreaterThan(0);
    expect(roadmap?.roadmap_milestones[0].roadmap_tasks.length).toBeGreaterThan(0);

    await expect(page.getByRole("heading", { name: "Tiến độ hành trình" })).toBeVisible();
    await page.getByRole("button", { name: /Hoàn thành:/ }).first().click();
    await expect.poll(async () => {
      const taskId = roadmap!.roadmap_milestones[0].roadmap_tasks[0].id;
      const { data } = await adminClient.from("roadmap_tasks").select("status, completed_at").eq("id", taskId).single();
      return data;
    }, { timeout: 30_000 }).toMatchObject({ status: "completed" });

    const { data: completedEvents, error: analyticsError } = await adminClient
      .from("analytics_events")
      .select("event_name, event_version, source")
      .eq("user_id", testUser.id)
      .eq("event_name", "ASSESSMENT_COMPLETED");
    expect(analyticsError).toBeNull();
    expect(completedEvents).toHaveLength(1);
    expect(completedEvents![0]).toMatchObject({ event_version: "v1", source: "server" });
  });
});
