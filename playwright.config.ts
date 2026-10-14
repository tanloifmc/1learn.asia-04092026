import { defineConfig, devices } from "@playwright/test";

function requireNonProductionEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required non-production E2E variable: ${name}`);
  return value;
}

const e2eEnvironment = process.env.E2E_ENV;
const isDiscoveryOrHelp = process.argv.some(
  (arg) => arg === "--list" || arg === "-h" || arg === "--help" || arg === "--version"
);

// If running in test discovery/IDE mode without an environment, provide fallback configuration
// instead of throwing an error immediately. When running actual tests, enforce strict security rules.
if (!e2eEnvironment && isDiscoveryOrHelp) {
  // Discovery mode allowed without error
} else {
  if (e2eEnvironment !== "development" && e2eEnvironment !== "staging") {
    throw new Error("E2E tests are restricted to an explicitly approved development or staging environment.");
  }

  const writeApprovalName = `E2E_ALLOW_${e2eEnvironment.toUpperCase()}_TEST_WRITES`;
  if (process.env[writeApprovalName] !== "true") {
    throw new Error(`E2E write tests require ${writeApprovalName}=true.`);
  }

  const e2eSupabaseUrl = requireNonProductionEnvironment("E2E_SUPABASE_URL");
  const e2eSupabaseProjectRef = requireNonProductionEnvironment("E2E_SUPABASE_PROJECT_REF");
  const e2eSupabaseServiceRoleKey = requireNonProductionEnvironment("E2E_SUPABASE_SERVICE_ROLE_KEY");
  const e2eSupabasePublishableKey = requireNonProductionEnvironment("E2E_SUPABASE_PUBLISHABLE_KEY");
  const e2eBaseUrl = requireNonProductionEnvironment("E2E_BASE_URL");
  const productionSupabaseProjectRef = process.env.E2E_PRODUCTION_SUPABASE_PROJECT_REF;
  const productionBaseUrl = process.env.E2E_PRODUCTION_BASE_URL;
  const hostnameProjectRef = new URL(e2eSupabaseUrl).hostname.split(".")[0];

  if (
    hostnameProjectRef !== e2eSupabaseProjectRef
    || (productionSupabaseProjectRef && e2eSupabaseProjectRef === productionSupabaseProjectRef)
    || (productionBaseUrl && new URL(e2eBaseUrl).origin === new URL(productionBaseUrl).origin)
  ) {
    throw new Error("E2E Supabase project must exactly match the approved non-production project.");
  }

  if (
    e2eEnvironment === "staging"
    && (!productionSupabaseProjectRef || !productionBaseUrl)
  ) {
    throw new Error("Staging E2E requires explicit production project and application references.");
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = e2eSupabaseUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = e2eSupabasePublishableKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = e2eSupabaseServiceRoleKey;
}

const e2eBaseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: [
    "**/full-student-flow.spec.ts",
    "**/full-student-journey.spec.ts",
    "**/playwright-validation.spec.ts",
  ],
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
});
