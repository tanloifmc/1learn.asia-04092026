import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const requiredNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

async function loadLocalEnvironment() {
  try {
    const content = await readFile(".env.local", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoError(error, label) {
  if (error) throw new Error(`${label} failed: ${error.message}`);
}

async function createTestUser(admin, runId, name) {
  const password = `CoreTest!${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email: `core-${runId}-${name}@example.invalid`,
    email_confirm: true,
    password,
    user_metadata: { display_name: `Core ${name}` },
  });
  assertNoError(error, `create ${name}`);
  assert(data.user, `create ${name} returned no user`);
  return { id: data.user.id, email: data.user.email, password };
}

async function signIn(url, publishableKey, email, password) {
  const client = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assertNoError(error, "password sign-in");
  assert(data.session, "password sign-in returned no session");
  return client;
}

async function deleteTestUsers(admin, userIds) {
  const results = await Promise.all(userIds.map(async (id) => {
    const { error } = await admin.auth.admin.deleteUser(id);
    return error;
  }));
  const cleanupError = results.find(Boolean);
  if (cleanupError) throw new Error(`test-user cleanup failed: ${cleanupError.message}`);
}

async function main() {
  if (process.env.RUN_LIVE_AUTH_RBAC !== "true") {
    throw new Error("Refusing live mutation. Set RUN_LIVE_AUTH_RBAC=true to run this acceptance check.");
  }

  await loadLocalEnvironment();
  for (const name of requiredNames) assert(process.env[name], `${name} is required`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const createdUserIds = [];

  try {
    const runId = randomUUID();
    const alice = await createTestUser(admin, runId, "alice");
    createdUserIds.push(alice.id);
    const bob = await createTestUser(admin, runId, "bob");
    createdUserIds.push(bob.id);

    const aliceClient = await signIn(url, publishableKey, alice.email, alice.password);
    const bobClient = await signIn(url, publishableKey, bob.email, bob.password);

    const { data: ownProfile, error: ownProfileError } = await aliceClient.from("profiles").select("id").eq("id", alice.id).single();
    assertNoError(ownProfileError, "read own profile");
    assert(ownProfile?.id === alice.id, "own profile is not visible to its owner");

    const { data: hiddenProfile, error: hiddenProfileError } = await aliceClient.from("profiles").select("id").eq("id", bob.id);
    assertNoError(hiddenProfileError, "read another profile");
    assert(hiddenProfile?.length === 0, "standard user can read another profile");

    const { data: ownRoles, error: ownRolesError } = await aliceClient.from("user_roles").select("role").eq("user_id", alice.id);
    assertNoError(ownRolesError, "read own roles");
    assert(ownRoles?.some((role) => role.role === "user"), "new user default role is missing");

    const { data: hiddenRoles, error: hiddenRolesError } = await aliceClient.from("user_roles").select("role").eq("user_id", bob.id);
    assertNoError(hiddenRolesError, "read another user's roles");
    assert(hiddenRoles?.length === 0, "standard user can read another user's roles");

    const entityId = randomUUID();
    const { error: favoriteInsertError } = await aliceClient.from("favorites").insert({
      entity_id: entityId,
      entity_type: "acceptance_entity",
      user_id: alice.id,
    });
    assertNoError(favoriteInsertError, "create own favorite");

    const { data: ownFavorites, error: ownFavoritesError } = await aliceClient.from("favorites").select("id").eq("entity_id", entityId);
    assertNoError(ownFavoritesError, "read own favorite");
    assert(ownFavorites?.length === 1, "own favorite is not visible");

    const { data: hiddenFavorites, error: hiddenFavoritesError } = await bobClient.from("favorites").select("id").eq("entity_id", entityId);
    assertNoError(hiddenFavoritesError, "read another user's favorite");
    assert(hiddenFavorites?.length === 0, "standard user can read another user's favorite");

    const { error: notificationInsertError } = await admin.from("notifications").insert({
      body: "Temporary acceptance notification.",
      recipient_user_id: alice.id,
      title: "Core acceptance",
      type: "system",
    });
    assertNoError(notificationInsertError, "create acceptance notification");

    const { data: ownNotifications, error: ownNotificationsError } = await aliceClient.from("notifications").select("id").eq("title", "Core acceptance");
    assertNoError(ownNotificationsError, "read own notification");
    assert(ownNotifications?.length === 1, "own notification is not visible");

    const { data: hiddenNotifications, error: hiddenNotificationsError } = await bobClient.from("notifications").select("id").eq("title", "Core acceptance");
    assertNoError(hiddenNotificationsError, "read another user's notification");
    assert(hiddenNotifications?.length === 0, "standard user can read another user's notification");

    const { error: roleInsertError } = await admin.from("user_roles").insert({ role: "admin", user_id: alice.id });
    assertNoError(roleInsertError, "grant temporary admin role");

    const { data: adminProfile, error: adminProfileError } = await aliceClient.from("profiles").select("id").eq("id", bob.id).single();
    assertNoError(adminProfileError, "admin reads another profile");
    assert(adminProfile?.id === bob.id, "administrator cannot read managed profile");

    console.log("Live auth and RLS acceptance passed. Temporary users were cleaned up.");
  } finally {
    await deleteTestUsers(admin, createdUserIds);
  }
}

main().catch((error) => {
  console.error(`Live auth and RLS acceptance failed: ${error.message}`);
  process.exitCode = 1;
});
