import dotenv from "dotenv";
import { spawnSync } from "node:child_process";

dotenv.config({ path: ".env.local" });

if (process.env.ALLOW_DEV_E2E_DATABASE_WRITES !== "true") {
  throw new Error("Set ALLOW_DEV_E2E_DATABASE_WRITES=true to run E2E tests that write to the development database.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.DEVELOPMENT_E2E_BASE_URL ?? "http://127.0.0.1:3016";

if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
  throw new Error("Development E2E requires the Supabase URL, publishable key, and service-role key in .env.local.");
}

const baseUrlHost = new URL(baseUrl).hostname;
if (baseUrlHost !== "127.0.0.1" && baseUrlHost !== "localhost") {
  throw new Error("Development E2E may only target a loopback application URL.");
}

const environment = {
  ...process.env,
  E2E_ENV: "development",
  E2E_ALLOW_DEVELOPMENT_TEST_WRITES: "true",
  E2E_BASE_URL: baseUrl,
  E2E_SUPABASE_URL: supabaseUrl,
  E2E_SUPABASE_PROJECT_REF: new URL(supabaseUrl).hostname.split(".")[0],
  E2E_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  E2E_SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
};

const result = spawnSync(
  process.execPath,
  ["./node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
  { env: environment, stdio: "inherit" },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
