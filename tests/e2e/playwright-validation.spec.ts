import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Phase 11 V3 Final Validation - Minh Journey', () => {
  // Use Minh account for testing
  const email = 'minh.test@1learn.asia';
  const password = 'password123';
  const parentEmail = 'parent.test@1learn.asia';

  test('Full Journey: Login -> Assessment -> Report -> Explore -> Compare -> Goal -> Journey -> Parent', async ({ page }) => {
    // 1. Landing -> Login
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // 2. Home Page
    await page.waitForURL('**/dashboard');
    await page.goto('/home');
    await page.waitForURL('**/home');
    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({ path: '01-home.png', fullPage: true });

    // 3. Assessment Page (Khám Phá)
    await page.click('text=Khám phá bản thân');
    await page.waitForURL('**/me/kham-pha');
    await expect(page.locator('text=Khoảng 20–30 phút')).toBeVisible();
    await page.screenshot({ path: '02-assessment.png', fullPage: true });

    // 4. Report Page (Báo Cáo)
    await page.goto('/me/bao-cao');
    await page.waitForURL('**/me/bao-cao');
    await page.screenshot({ path: '03-report.png', fullPage: true });

    // 5. Explore (Tìm hiểu ngành nghề)
    await page.goto('/explore');
    await page.waitForURL('**/explore');
    await page.screenshot({ path: '04-explore.png', fullPage: true });

    // 6. Compare (So sánh)
    await page.goto('/explore/so-sanh');
    await page.waitForURL('**/explore/so-sanh');
    await page.screenshot({ path: '05-compare.png', fullPage: true });

    // 7. Goal (Mục tiêu của em)
    await page.goto('/goal');
    await page.waitForURL('**/goal');
    await page.screenshot({ path: '06-goal.png', fullPage: true });

    // 8. Journey (Hành trình)
    await page.goto('/journey');
    await page.waitForURL('**/journey');
    await page.screenshot({ path: '07-journey.png', fullPage: true });

    // Complete Task Action
    const completeBtn = page.locator('button:has-text("Đánh dấu hoàn thành")');
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: '07-journey-after-complete.png', fullPage: true });
    }

    // Return to Home to see updated state
    await page.goto('/home');
    await page.waitForURL('**/home');
    await page.screenshot({ path: '09-home-after.png', fullPage: true });

    // Logout
    await page.goto('/logout'); 
    
    // Parent Flow
    await page.goto('/login');
    await page.fill('input[name="email"]', parentEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');
    await page.goto('/parent/home');
    await page.waitForURL('**/parent/home');
    await expect(page.locator('h1', { hasText: 'Tổng quan hành trình' })).toBeVisible();
    await page.screenshot({ path: '08-parent.png', fullPage: true });
  });
});
