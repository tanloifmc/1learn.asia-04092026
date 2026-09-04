import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// We need an admin client to create test users
const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function runSecurityAudit() {
  console.log("=== PHASE C: HOSTILE SECURITY AUDIT ===");

  // 1. Create Test Users
  const studentAEmail = `studentA_${Date.now()}@test.com`;
  const studentBEmail = `studentB_${Date.now()}@test.com`;
  
  const { data: authA } = await adminClient.auth.admin.createUser({ email: studentAEmail, password: 'password123', email_confirm: true });
  const { data: authB } = await adminClient.auth.admin.createUser({ email: studentBEmail, password: 'password123', email_confirm: true });
  
  const studentA_Id = authA.user!.id;
  const studentB_Id = authB.user!.id;

  // Insert profile for both to make them valid users
  await adminClient.from('profiles').insert([
    { id: studentA_Id, role: 'student', full_name: 'Student A' },
    { id: studentB_Id, role: 'student', full_name: 'Student B' }
  ]);

  // Create an authenticated client for Student A
  const studentAClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  await studentAClient.auth.signInWithPassword({ email: studentAEmail, password: 'password123' });

  let passCount = 0;
  let failCount = 0;

  function assertDenied(testName: string, error: any, data: any) {
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      console.log(`✅ PASS: ${testName} (Access Denied)`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${testName} (Access Granted!)`, data);
      failCount++;
    }
  }

  console.log("\n--- 1. IDOR & RLS TESTS ---");
  // Student A tries to read Student B's profile
  const { data: pData, error: pError } = await studentAClient.from('profiles').select('*').eq('id', studentB_Id);
  assertDenied("Student A reading Student B profile", pError, pData);

  // Student A tries to read Student B's assessments
  const { data: aData, error: aError } = await studentAClient.from('assessments').select('*').eq('student_id', studentB_Id);
  assertDenied("Student A reading Student B assessments", aError, aData);

  console.log("\n--- 2. PRIVILEGE ESCALATION TESTS ---");
  // Student A tries to update their role to admin
  const { data: roleData, error: roleError } = await studentAClient.from('profiles').update({ role: 'admin' }).eq('id', studentA_Id).select();
  // Role column might not be updatable, or RLS might block it. Let's see.
  // Actually, RLS policy for update should prevent it, or we check if role actually changed.
  if (roleError || (roleData && roleData.length === 0)) {
    console.log(`✅ PASS: Student A escalating to admin (Update Blocked)`);
    passCount++;
  } else {
    // Check if role actually changed
    const currentRole = roleData?.[0]?.role;
    if (currentRole === 'admin') {
      console.error(`❌ FAIL: Student A escalating to admin (Role updated to admin!)`);
      failCount++;
    } else {
      console.log(`✅ PASS: Student A escalating to admin (Role update ignored)`);
      passCount++;
    }
  }

  // Student A tries to call admin RPC
  const { data: rpcData, error: rpcError } = await studentAClient.rpc('bootstrap_super_admin');
  assertDenied("Student A calling bootstrap_super_admin", rpcError, rpcData);

  console.log("\n--- 3. TOKEN SECURITY TESTS ---");
  // We need a parent to test token redemption
  const parentEmail = `parent_${Date.now()}@test.com`;
  const { data: authParent } = await adminClient.auth.admin.createUser({ email: parentEmail, password: 'password123', email_confirm: true });
  const parentId = authParent.user!.id;
  await adminClient.from('profiles').insert([{ id: parentId, role: 'parent', full_name: 'Parent A' }]);

  const parentClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  await parentClient.auth.signInWithPassword({ email: parentEmail, password: 'password123' });

  // Student A creates an invitation token
  const rawToken = "SECRET_TOKEN_" + Date.now();
  import('crypto').then(async (crypto) => {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    
    // Create valid token
    const { data: invData } = await adminClient.from('parent_link_invitations').insert({
      student_id: studentA_Id,
      token_hash: tokenHash,
      status: 'pending',
      expires_at: new Date(Date.now() + 86400000).toISOString()
    }).select().single();

    // Concurrent Redemption Test
    console.log("Testing Concurrent Redemptions...");
    const redeem1 = parentClient.rpc('redeem_parent_invitation', { p_token_hash: tokenHash, p_parent_id: parentId, p_relationship_type: 'father' });
    const redeem2 = parentClient.rpc('redeem_parent_invitation', { p_token_hash: tokenHash, p_parent_id: parentId, p_relationship_type: 'father' });
    
    const [res1, res2] = await Promise.all([redeem1, redeem2]);
    
    let successes = 0;
    let linkId = '';
    if (res1.data?.success) { successes++; linkId = res1.data.link_id; }
    if (res2.data?.success) { successes++; linkId = res2.data.link_id; }

    if (successes === 1) {
      console.log(`✅ PASS: Concurrent redemption (Only 1 succeeded)`);
      passCount++;
    } else {
      console.error(`❌ FAIL: Concurrent redemption (Succeeded ${successes} times instead of 1)`);
      failCount++;
    }

    // Replay attack test
    console.log("Testing Replay Attack...");
    const replayRes = await parentClient.rpc('redeem_parent_invitation', { p_token_hash: tokenHash, p_parent_id: parentId, p_relationship_type: 'father' });
    assertDenied("Replay Attack (Used token)", replayRes.data?.success ? null : { error: "Denied" }, replayRes.data?.success ? "Success" : null);

    // Brute force test (wrong token)
    console.log("Testing Brute Force (Wrong token)...");
    const wrongRes = await parentClient.rpc('redeem_parent_invitation', { p_token_hash: "wrong_hash", p_parent_id: parentId, p_relationship_type: 'father' });
    assertDenied("Wrong token redemption", wrongRes.data?.success ? null : { error: "Denied" }, wrongRes.data?.success ? "Success" : null);

    // Expired token test
    console.log("Testing Expired Token...");
    const tokenHashExp = crypto.createHash("sha256").update("EXPIRED_" + Date.now()).digest("hex");
    await adminClient.from('parent_link_invitations').insert({
      student_id: studentA_Id,
      token_hash: tokenHashExp,
      status: 'pending',
      expires_at: new Date(Date.now() - 86400000).toISOString()
    });
    const expRes = await parentClient.rpc('redeem_parent_invitation', { p_token_hash: tokenHashExp, p_parent_id: parentId, p_relationship_type: 'father' });
    assertDenied("Expired token redemption", expRes.data?.success ? null : { error: "Denied" }, expRes.data?.success ? "Success" : null);

    console.log("\n--- 4. PARENT PRIVACY ESCALATION TESTS ---");
    
    if (!linkId) {
       console.log("❌ FAIL: Cannot proceed with privacy tests because token redemption failed completely.");
       process.exit(1);
    }
    
    // Set permission levels to 1 (Overview only)
    await adminClient.from('parent_sharing_permissions').update({
      assessment_level: 1,
      roadmap_level: 1,
      academic_level: 1,
      career_profile_level: 1
    }).eq('link_id', linkId);

    // Get an existing version
    const versionRes = await adminClient.from('assessment_versions').select('id').limit(1).single();
    if (versionRes.error || !versionRes.data) throw new Error("No version found");
    const versionData = versionRes.data;
    
    const sessionRes = await adminClient.from('assessment_sessions').insert({
      student_id: studentA_Id,
      version_id: versionData.id
    }).select().single();
    if (sessionRes.error) throw new Error("Session error: " + JSON.stringify(sessionRes.error));
    const sessionData = sessionRes.data;

    // Get an existing question
    const qRes = await adminClient.from('assessment_questions').select('id').eq('version_id', versionData.id).limit(1).single();
    let qId = qRes.data?.id;
    if (!qId) {
       // Insert one if not found
       const newQRes = await adminClient.from('assessment_questions').insert({
         version_id: versionData.id,
         text: 'Test Q',
         dimension_id: 'R',
         scoring_weight: 1
       }).select().single();
       if (newQRes.error) throw new Error("Question error: " + JSON.stringify(newQRes.error));
       qId = newQRes.data.id;
    }

    const respRes = await adminClient.from('assessment_responses').insert({
      session_id: sessionData!.id,
      question_id: qId,
      response_value: 5
    });
    if (respRes.error) throw new Error("Response error: " + JSON.stringify(respRes.error));

    const resRes = await adminClient.from('assessment_results').insert({
      session_id: sessionData!.id,
      student_id: studentA_Id,
      version_id: versionData!.id,
      scoring_version: 'v1',
      completion_quality: {},
      confidence: {}
    }).select().single();
    if (resRes.error) throw new Error("Result error: " + JSON.stringify(resRes.error));
    const resData = resRes.data;

    const dimSelect = await adminClient.from('assessment_dimensions').select('id').limit(1).single();
    let dimId = dimSelect.data?.id;
    if (!dimId) {
      const newDim = await adminClient.from('assessment_dimensions').insert({
        name: 'Test Dim',
        description: 'Test'
      }).select().single();
      dimId = newDim.data!.id;
    }

    const dimRes = await adminClient.from('assessment_result_dimensions').insert({
      result_id: resData!.id,
      dimension_id: dimId,
      score: 10
    });
    if (dimRes.error) throw new Error("Dim error: " + JSON.stringify(dimRes.error));

    const rmRes = await adminClient.from('roadmaps').insert({
      student_id: studentA_Id,
      generator_version: 'v1',
      profile_version: 1,
      academic_data_version: new Date().toISOString()
    }).select().single();
    if (rmRes.error) throw new Error("Roadmap error: " + JSON.stringify(rmRes.error));
    const rmData = rmRes.data;

    const msRes = await adminClient.from('roadmap_milestones').insert({
      roadmap_id: rmData!.id,
      title: 'Test MS',
      priority: 'high',
      order_index: 1
    }).select().single();
    if (msRes.error) throw new Error("Milestone error: " + JSON.stringify(msRes.error));
    const msData = msRes.data;

    const taskRes = await adminClient.from('roadmap_tasks').insert({
      milestone_id: msData!.id,
      title: 'Test Task',
      task_type: 'research',
      priority: 'high'
    });
    if (taskRes.error) throw new Error("Task error: " + JSON.stringify(taskRes.error));

    // Parent A, accepted, assessment level 1, tries to read detailed assessment -> DENY
    const { data: resDimData, error: resDimError } = await parentClient.from('assessment_result_dimensions').select('*').eq('result_id', resData!.id);
    assertDenied("Parent (Lvl 1) reading detailed assessment", resDimError, resDimData);

    // Parent A, accepted, assessment level 1, tries to read raw answers -> DENY
    const { data: rawAnsData, error: rawAnsError } = await parentClient.from('assessment_responses').select('*').eq('session_id', sessionData!.id);
    assertDenied("Parent (Lvl 1) reading raw answers", rawAnsError, rawAnsData);

    // Parent A, accepted, roadmap level 1, tries to read detailed task -> DENY
    const { data: detailTaskData, error: detailTaskError } = await parentClient.from('roadmap_tasks').select('*').eq('milestone_id', msData!.id);
    assertDenied("Parent (Lvl 1) reading detailed task", detailTaskError, detailTaskData);

    console.log(`\n=== AUDIT SUMMARY ===`);
    console.log(`Total Tests: ${passCount + failCount}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);

    if (failCount === 0) {
      console.log(`\n✅ "No known critical/high security findings after the defined audit scope and tests."`);
    } else {
      console.log(`\n❌ Action required: Fix failing tests.`);
      process.exit(1);
    }
    process.exit(0);
  });
}

runSecurityAudit().catch(console.error);
