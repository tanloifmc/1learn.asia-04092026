import crypto from "node:crypto";
import { expect, test } from "@playwright/test";
import { adminClient, cleanupIsolatedUser, createIsolatedStudent } from "../helpers/test-users";

test.describe("Critical student Premium payment", () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeEach(async () => {
    testUser = await createIsolatedStudent();
  });

  test.afterEach(async () => {
    if (testUser) await cleanupIsolatedUser(testUser.id);
  });

  test("creates a protected pending payment and activates Premium exactly once from a signed webhook", async ({ page, request }) => {
    test.setTimeout(90_000);
    const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("SEPAY_WEBHOOK_SECRET is required for the signed webhook integration test.");

    await page.goto("/login");
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/onboarding");

    await page.goto("/membership/checkout");
    await expect(page.getByText("Thanh toán chuyển khoản")).toBeVisible();

    const { data: pending, error: pendingError } = await adminClient
      .from("payment_transactions")
      .select("id, transaction_code, amount, status")
      .eq("user_id", testUser.id)
      .eq("status", "pending")
      .single();
    expect(pendingError).toBeNull();
    expect(pending?.transaction_code).toMatch(/^1L-[A-Z0-9]{8}$/);
    expect(pending?.amount).toBe(149000);
    await expect(page.getByText(pending!.transaction_code!, { exact: true })).toBeVisible();

    const timestamp = String(Math.floor(Date.now() / 1000));
    const payload = {
      id: `e2e-${crypto.randomUUID()}`,
      transferAmount: pending!.amount,
      transferType: "in",
      accountNumber: "development-test-account",
      content: `Premium ${pending!.transaction_code}`,
    };
    const rawBody = JSON.stringify(payload);
    const signature = `sha256=${crypto.createHmac("sha256", webhookSecret).update(`${timestamp}.${rawBody}`).digest("hex")}`;

    const invalidResponse = await request.post("/hooks/sepay-payment", {
      data: rawBody,
      headers: { "content-type": "application/json", "x-sepay-timestamp": timestamp, "x-sepay-signature": "sha256=invalid" },
    });
    expect(invalidResponse.status()).toBe(401);

    const settledResponse = await request.post("/hooks/sepay-payment", {
      data: rawBody,
      headers: { "content-type": "application/json", "x-sepay-timestamp": timestamp, "x-sepay-signature": signature },
    });
    expect(settledResponse.status()).toBe(200);
    await expect(settledResponse.json()).resolves.toMatchObject({ success: true, outcome: "processed" });

    const { data: settled, error: settledError } = await adminClient
      .from("payment_transactions")
      .select("status, provider_transaction_id, confirmed_at")
      .eq("id", pending!.id)
      .single();
    expect(settledError).toBeNull();
    expect(settled).toMatchObject({ status: "completed", provider_transaction_id: payload.id });
    expect(settled?.confirmed_at).not.toBeNull();

    const { count: subscriptionCount, error: subscriptionError } = await adminClient
      .from("membership_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", testUser.id)
      .eq("is_active", true);
    expect(subscriptionError).toBeNull();
    expect(subscriptionCount).toBe(1);

    const duplicateResponse = await request.post("/hooks/sepay-payment", {
      data: rawBody,
      headers: { "content-type": "application/json", "x-sepay-timestamp": timestamp, "x-sepay-signature": signature },
    });
    expect(duplicateResponse.status()).toBe(200);
    await expect(duplicateResponse.json()).resolves.toMatchObject({ success: true, outcome: "already_processed" });

    const { count: subscriptionCountAfterRetry, error: subscriptionRetryError } = await adminClient
      .from("membership_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", testUser.id)
      .eq("is_active", true);
    expect(subscriptionRetryError).toBeNull();
    expect(subscriptionCountAfterRetry).toBe(1);
  });
});
