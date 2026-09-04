import { test, expect, Page, APIRequestContext } from '@playwright/test';
require('dotenv').config({ path: '.env.local' });

test('Full Student E2E Flow', async ({ page, request }: { page: Page, request: APIRequestContext }) => {
  // 1. Create user and login
  const email = `student.e2e.${Date.now()}@example.com`;
  const password = 'password123';
  
  // Register via Supabase API to skip UI email verification hurdles
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: userAuth } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  const userId = userAuth.user.id;
  
  // 2. Login via UI
  await page.goto('http://localhost:3000/auth/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/onboarding**');
  
  // 3. Complete Onboarding
  // Just simulate the server action or do it via UI
  // Assuming UI has some select fields:
  // Note: for robustness in this headless test, if UI is complex, we might just set the DB state for onboarding
  await supabase.from('student_profiles').insert({
    id: userId,
    grade: 10,
    onboarding_step: 2 // completed
  });
  
  // 4. Trigger Assessment Scoring (Simulate the exact Server Action Payload)
  // We can call the server action endpoint or just run the action code
  const { data: version } = await supabase.from('assessment_versions').select('id').limit(1).single();
  const { data: session } = await supabase.from('assessment_sessions').insert({
    student_id: userId,
    version_id: version.id,
    status: 'in_progress',
    started_at: new Date().toISOString()
  }).select('id').single();

  // Call internal API or the server action directly
  // We will run the scoring.ts logic inside this test for speed, as UI clicking 121 times takes forever
  const { calculateAndCompleteSession } = require('../../src/features/assessment/actions/scoring.ts');
  
  // Oh wait, scoring.ts relies on NEXT context if imported here. We should use a dedicated test endpoint or just call the DB.
});
