import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect } from "@playwright/test";

let _adminClient: any = null;

export function getAdminClient(): any {
  if (_adminClient) return _adminClient;

  const supabaseUrl = process.env.E2E_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY!;
  const nonProductionProjectRef = process.env.E2E_SUPABASE_PROJECT_REF!;
  const productionProjectRef = process.env.E2E_PRODUCTION_SUPABASE_PROJECT_REF;
  const e2eEnvironment = process.env.E2E_ENV;

  if (e2eEnvironment !== "development" && e2eEnvironment !== "staging") {
    throw new Error("E2E write tests require an explicitly approved development or staging environment.");
  }

  const writeApprovalName = `E2E_ALLOW_${e2eEnvironment.toUpperCase()}_TEST_WRITES`;
  if (process.env[writeApprovalName] !== "true") {
    throw new Error(`E2E write tests require ${writeApprovalName}=true.`);
  }

  if (!supabaseUrl || !supabaseServiceRoleKey || !nonProductionProjectRef) {
    throw new Error("Missing required non-production E2E Supabase configuration.");
  }

  if (
    new URL(supabaseUrl).hostname.split(".")[0] !== nonProductionProjectRef
    || (productionProjectRef && nonProductionProjectRef === productionProjectRef)
  ) {
    throw new Error("E2E write tests rejected an unapproved Supabase project.");
  }

  if (e2eEnvironment === "staging" && !productionProjectRef) {
    throw new Error("Staging E2E requires an explicit production Supabase project reference.");
  }

  _adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _adminClient;
}

export const adminClient: any = new Proxy({}, {
  get(_target, prop) {
    return getAdminClient()[prop];
  },
});

export async function createIsolatedStudent() {
  const password = `TestStudent!${randomUUID()}`;
  const email = `student_test_${randomUUID().slice(0, 8)}@example.invalid`;

  const client = getAdminClient();
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'student', display_name: 'E2E Test Student' }
  });

  if (error || !data.user) {
    throw new Error(`Failed to create isolated student: ${error?.message}`);
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .single();
  if (profileError || !profile) {
    throw new Error(`Auth user was created without a profile: ${profileError?.message}`);
  }

  // E2E accounts are explicitly marked as development-only records.
  const { error: demoError } = await client.from('profiles').update({ is_demo: true }).eq('id', data.user.id);
  if (demoError) throw new Error(`Failed to mark isolated student as a demo user: ${demoError.message}`);

  return { id: data.user.id, email, password };
}

export async function createIsolatedParent() {
  const password = `TestParent!${randomUUID()}`;
  const email = `parent_test_${randomUUID().slice(0, 8)}@example.invalid`;

  const client = getAdminClient();
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'parent', display_name: 'E2E Test Parent' }
  });

  if (error || !data.user) {
    throw new Error(`Failed to create isolated parent: ${error?.message}`);
  }

  await client.from('profiles').update({ is_demo: true }).eq('id', data.user.id);

  return { id: data.user.id, email, password };
}

export async function cleanupIsolatedUser(userId: string) {
  // Cascading deletes should clean up related records (goals, roadmaps, links, assessments)
  // because we established ON DELETE CASCADE in the DB schema for core tables.
  const client = getAdminClient();
  const { error } = await client.auth.admin.deleteUser(userId);
  if (error) {
    console.error(`Failed to cleanup user ${userId}:`, error.message);
  }
}

// Business State Checkpoints (Run server-side only)
export async function assertAssessmentCompleted(userId: string) {
  const client = getAdminClient();
  const { data, error } = await client
    .from('assessment_result_dimensions')
    .select('id')
    .eq('student_id', userId);
  
  expect(error).toBeNull();
  expect(data?.length).toBeGreaterThan(0);
}

export async function assertGoalCreated(userId: string) {
  const client = getAdminClient();
  const { data, error } = await client
    .from('student_goals')
    .select('id')
    .eq('student_id', userId);
  
  expect(error).toBeNull();
  expect(data?.length).toBeGreaterThan(0);
}

export async function assertTaskCompleted(userId: string, taskId: string) {
  const client = getAdminClient();
  const { data, error } = await client
    .from('roadmap_tasks')
    .select('status')
    .eq('id', taskId)
    .single();
  
  expect(error).toBeNull();
  expect(data?.status).toBe('completed');
}
