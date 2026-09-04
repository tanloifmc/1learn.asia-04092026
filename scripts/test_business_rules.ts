import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testBusinessRules() {
  console.log("Running Business Rules Database Test...");
  let passCount = 0;
  let failCount = 0;

  // 1. Create a dummy career, publish it, edit it, check if it downgrades.
  const code = 'TEST_RULE_' + Date.now();
  
  // Create admin user for created_by
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const adminId = users?.users[0]?.id;

  const { data: career, error } = await supabaseAdmin.from('careers').insert({
    code,
    name: 'Test Career',
    slug: 'test-rule-' + Date.now(),
    career_domain_code: 'TEST',
    status: 'published',
    created_by: adminId,
    description: 'Original description'
  }).select().single();

  if (error) {
    console.error("Test setup failed", error);
    return;
  }

  // Update content
  const { data: updatedCareer, error: updateErr } = await supabaseAdmin.from('careers').update({
    description: 'Modified description'
  }).eq('id', career.id).select().single();

  if (updateErr) {
    console.error("Update failed", updateErr);
  }

  if (updatedCareer.status === 'needs_verification') {
    console.log("✅ PASS: Published -> Edit -> Needs Verification trigger worked!");
    passCount++;
  } else {
    console.error(`❌ FAIL: Expected status 'needs_verification', got '${updatedCareer.status}'`);
    failCount++;
  }

  // 2. Test Archived visibility using RLS
  // First, set it to archived via admin
  await supabaseAdmin.from('careers').update({ status: 'archived' }).eq('id', career.id);

  // Now try to select it via Anon key (Student/Public)
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: fetchAnon, error: fetchErr } = await supabaseAnon.from('careers').select('*').eq('id', career.id);
  
  if (fetchErr) {
    console.error("Fetch failed", fetchErr);
  }

  if (fetchAnon && fetchAnon.length === 0) {
    console.log("✅ PASS: Archived career is hidden from public/student via RLS!");
    passCount++;
  } else {
    console.error("❌ FAIL: Public/Student can see archived career!");
    failCount++;
  }

  // Clean up
  await supabaseAdmin.from('careers').delete().eq('id', career.id);

  console.log(`\nTest Summary: ${passCount} Passed, ${failCount} Failed.`);
  if (failCount > 0) {
    process.exit(1);
  }
}

testBusinessRules().catch(console.error);
