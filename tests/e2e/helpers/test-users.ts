import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect } from "@playwright/test";

// These variables will NOT be accessible in the browser context
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase configuration in test runner environment.");
}

// Ensure we are NEVER running this against production
const knownProdRefs = ['cbhkriy', process.env.PROD_SUPABASE_PROJECT_REF].filter(Boolean);
const isProd = knownProdRefs.some(ref => supabaseUrl.includes(ref as string));
if (isProd) {
    throw new Error("NGUY HIỂM: Không được phép chạy E2E Write Tests trên Database Production!");
}

export const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function createIsolatedStudent() {
  const password = `TestStudent!${randomUUID()}`;
  const email = `student_test_${randomUUID().slice(0, 8)}@example.invalid`;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'student', display_name: 'E2E Test Student' }
  });

  if (error || !data.user) {
    throw new Error(`Failed to create isolated student: ${error?.message}`);
  }

  // Ensure is_demo = true just in case
  await adminClient.from('profiles').update({ is_demo: true }).eq('id', data.user.id);

  return { id: data.user.id, email, password };
}

export async function createIsolatedParent() {
  const password = `TestParent!${randomUUID()}`;
  const email = `parent_test_${randomUUID().slice(0, 8)}@example.invalid`;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'parent', display_name: 'E2E Test Parent' }
  });

  if (error || !data.user) {
    throw new Error(`Failed to create isolated parent: ${error?.message}`);
  }

  await adminClient.from('profiles').update({ is_demo: true }).eq('id', data.user.id);

  return { id: data.user.id, email, password };
}

export async function cleanupIsolatedUser(userId: string) {
  // Cascading deletes should clean up related records (goals, roadmaps, links, assessments)
  // because we established ON DELETE CASCADE in the DB schema for core tables.
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    console.error(`Failed to cleanup user ${userId}:`, error.message);
  }
}

// Business State Checkpoints (Run server-side only)
export async function assertAssessmentCompleted(userId: string) {
  const { data, error } = await adminClient
    .from('assessment_result_dimensions')
    .select('id')
    .eq('student_id', userId);
  
  expect(error).toBeNull();
  expect(data?.length).toBeGreaterThan(0);
}

export async function assertGoalCreated(userId: string) {
    const { data, error } = await adminClient
      .from('student_goals')
      .select('id')
      .eq('student_id', userId);
    
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
}

export async function assertTaskCompleted(userId: string, taskId: string) {
    const { data, error } = await adminClient
      .from('roadmap_tasks')
      .select('status')
      .eq('id', taskId)
      .single();
    
    expect(error).toBeNull();
    expect(data?.status).toBe('completed');
}
