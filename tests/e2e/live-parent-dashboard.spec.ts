import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Setup a Supabase client with the service role key for admin tasks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe.serial('Phase 7: Parent Dashboard Security & RLS (Cases A-N)', () => {
  let student1: any;
  let student2: any;
  let parent1: any;
  let parent2: any;

  // Helper to create test users
  async function createTestUser(role: string, email: string) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true,
    });
    if (authError) throw authError;

    // Set role in profile
    await supabaseAdmin
      .from('profiles')
      .update({ role, full_name: `Test ${role}` })
      .eq('id', authData.user.id);

    return authData.user;
  }

  // Create clients for users
  function createAuthenticatedClient(userId: string) {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );
    return client;
  }

  test.beforeAll(async () => {
    // Create students and parents
    const suffix = Date.now();
    student1 = await createTestUser('student', `student1_${suffix}@test.com`);
    student2 = await createTestUser('student', `student2_${suffix}@test.com`);
    parent1 = await createTestUser('parent', `parent1_${suffix}@test.com`);
    parent2 = await createTestUser('parent', `parent2_${suffix}@test.com`);
  });

  test.afterAll(async () => {
    // Cleanup users (cascades to their data)
    for (const u of [student1, student2, parent1, parent2]) {
      if (u) await supabaseAdmin.auth.admin.deleteUser(u.id);
    }
  });

  // Since we are testing RPC and RLS via the database API directly, we will use the clients
  let student1Client: any;
  let parent1Client: any;
  let rawToken: string;
  let tokenHash: string;
  let linkId: string;

  test.beforeEach(async () => {
    student1Client = createAuthenticatedClient(student1.id);
    await student1Client.auth.signInWithPassword({ email: student1.email, password: 'password123' });
    
    parent1Client = createAuthenticatedClient(parent1.id);
    await parent1Client.auth.signInWithPassword({ email: parent1.email, password: 'password123' });
  });

  test('Case A: Student can generate an invitation token', async () => {
    rawToken = crypto.randomBytes(4).toString('hex');
    tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await student1Client
      .from('parent_link_invitations')
      .insert({
        student_id: student1.id,
        token_hash: tokenHash,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.student_id).toBe(student1.id);
    expect(data.status).toBe('pending');
  });

  test('Case B: Generating a new token revokes old pending tokens', async () => {
    const rawToken2 = crypto.randomBytes(4).toString('hex');
    const tokenHash2 = crypto.createHash('sha256').update(rawToken2).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert second token
    await student1Client
      .from('parent_link_invitations')
      .insert({
        student_id: student1.id,
        token_hash: tokenHash2,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      });

    // Check first token status using admin (to bypass any RLS caches just in case, though RLS allows it)
    const { data: firstToken } = await supabaseAdmin
      .from('parent_link_invitations')
      .select('status')
      .eq('token_hash', tokenHash)
      .single();

    expect(firstToken?.status).toBe('revoked'); // Trigger worked

    // Revert it back to pending for following tests
    await supabaseAdmin
      .from('parent_link_invitations')
      .update({ status: 'pending' })
      .eq('token_hash', tokenHash);
  });

  test('Case C: Parent can redeem a valid token', async () => {
    const { data, error } = await parent1Client.rpc('redeem_parent_invitation', {
      p_token_hash: tokenHash,
      p_parent_id: parent1.id
    });

    expect(error).toBeNull();
    expect(data.success).toBe(true);
    expect(data.student_id).toBe(student1.id);
    linkId = data.link_id;
  });

  test('Case D: Token cannot be redeemed twice', async () => {
    const { data } = await parent1Client.rpc('redeem_parent_invitation', {
      p_token_hash: tokenHash,
      p_parent_id: parent1.id
    });

    expect(data.success).toBe(false);
    expect(data.error).toBe('Token is no longer valid');
  });

  test('Case E: Token cannot be redeemed after it expires', async () => {
    // Insert an expired token
    const suffix = Date.now().toString() + Math.random().toString();
    const tokenHashExpired = crypto.createHash('sha256').update('expired' + suffix).digest('hex');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const { error: insertError } = await supabaseAdmin.from('parent_link_invitations').insert({
      student_id: student2.id,
      token_hash: tokenHashExpired,
      status: 'pending',
      expires_at: pastDate.toISOString()
    });
    if (insertError) throw insertError;

    const { data } = await parent1Client.rpc('redeem_parent_invitation', {
      p_token_hash: tokenHashExpired,
      p_parent_id: parent1.id
    });

    expect(data.success).toBe(false);
    expect(data.error).toBe('Token has expired');
  });

  test('Case F: Parent cannot link to themselves', async () => {
    const workerSuffix = Date.now().toString() + Math.random().toString();
    const selfToken = crypto.createHash('sha256').update('self' + workerSuffix).digest('hex');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    // Parent1 creates an invitation for themselves
    const { error: insertError } = await supabaseAdmin.from('parent_link_invitations').insert({
      student_id: parent1.id,
      token_hash: selfToken,
      status: 'pending',
      expires_at: futureDate.toISOString()
    });
    if (insertError) throw insertError;

    const { data } = await parent1Client.rpc('redeem_parent_invitation', {
      p_token_hash: selfToken,
      p_parent_id: parent1.id
    });

    expect(data.success).toBe(false);
    expect(data.error).toBe('Cannot link to yourself');
  });

  test('Case G: Parent cannot link if they are already linked', async () => {
    // Generate a fresh token for student1
    const workerSuffix = Date.now().toString() + Math.random().toString();
    const tokenHashDup = crypto.createHash('sha256').update('dup' + workerSuffix).digest('hex');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const { error: insertError } = await supabaseAdmin.from('parent_link_invitations').insert({
      student_id: student1.id,
      token_hash: tokenHashDup,
      status: 'pending',
      expires_at: futureDate.toISOString()
    });
    if (insertError) throw insertError;

    // parent1 is already linked to student1 via Case C
    const { data } = await parent1Client.rpc('redeem_parent_invitation', {
      p_token_hash: tokenHashDup,
      p_parent_id: parent1.id
    });

    expect(data.success).toBe(false);
    expect(data.error).toBe('Already linked to this student');
  });

  test('Case H: Students can view their own invitations but not others', async () => {
    const { data: own } = await student1Client.from('parent_link_invitations').select('id');
    expect(own.length).toBeGreaterThan(0);

    const student2Client = createAuthenticatedClient(student2.id);
    await student2Client.auth.signInWithPassword({ email: student2.email, password: 'password123' });

    // Try to see student1's invitation
    const { data: others } = await student2Client.from('parent_link_invitations').select('id').eq('student_id', student1.id);
    expect(others?.length).toBe(0);
  });

  test('Case I: Parents cannot view invitations table', async () => {
    const parent2Client = createAuthenticatedClient(parent2.id);
    await parent2Client.auth.signInWithPassword({ email: parent2.email, password: 'password123' });
    const { data, error } = await parent2Client.from('parent_link_invitations').select('*');
    // RLS policy: USING (auth.uid() = student_id)
    // Parent is not the student_id of the invitation, so should get 0 rows
    expect(data?.length).toBe(0);
  });

  test('Case J: Parent and Student can view the link', async () => {
    const { data: studentLink, error: sErr } = await student1Client.from('parent_child_links').select('*').eq('id', linkId);
    expect(studentLink?.length).toBe(1);

    const { data: parentLink } = await parent1Client.from('parent_child_links').select('id').eq('id', linkId);
    expect(parentLink?.length).toBe(1);
  });

  test('Case K: Other users cannot view the link', async () => {
    const parent2Client = createAuthenticatedClient(parent2.id);
    await parent2Client.auth.signInWithPassword({ email: parent2.email, password: 'password123' });

    const { data } = await parent2Client.from('parent_child_links').select('id').eq('id', linkId);
    expect(data?.length).toBe(0);
  });

  test('Case L: Only students can update sharing permissions', async () => {
    const { error } = await student1Client
      .from('parent_sharing_permissions')
      .update({ career_profile_level: 2 })
      .eq('link_id', linkId);
    
    expect(error).toBeNull();
  });

  test('Case M: Parent cannot update sharing permissions', async () => {
    const { data, error } = await parent1Client
      .from('parent_sharing_permissions')
      .update({ career_profile_level: 0 })
      .eq('link_id', linkId)
      .select();
    
    // RLS blocks it, so 0 rows are updated
    expect(data?.length).toBe(0);
  });

  test('Case N: Both parent and student can view sharing permissions', async () => {
    const { data: sPerm } = await student1Client.from('parent_sharing_permissions').select('career_profile_level').eq('link_id', linkId);
    expect(sPerm?.[0].career_profile_level).toBe(2); // From Case L

    const { data: pPerm } = await parent1Client.from('parent_sharing_permissions').select('career_profile_level').eq('link_id', linkId);
    expect(pPerm?.[0].career_profile_level).toBe(2);
  });
});
