import { readFileSync } from "node:fs";

const environmentTemplate = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
const entries = new Map(
  environmentTemplate
    .split(/\r?\n/)
    .filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line))
    .map((line) => {
      const [name, value] = line.split("=", 2);
      return [name, value];
    }),
);

const requiredNames = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_WEBHOOK_SECRET",
  "SENTRY_DSN",
];
const serverSecretNames = ["SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_WEBHOOK_SECRET", "SENTRY_DSN"];
const forbiddenNames = [/^SEPAY_/, /^STRIPE_/, /^PAYPAL_/];
const errors = [];

for (const name of requiredNames) {
  if (!entries.has(name)) errors.push(`Missing ${name} in .env.example.`);
}

for (const name of serverSecretNames) {
  if (entries.get(name)) errors.push(`${name} must be blank in .env.example.`);
}

for (const name of entries.keys()) {
  if (forbiddenNames.some((pattern) => pattern.test(name))) errors.push(`${name} is application-specific and must not be in the reusable core contract.`);
}

for (const requiredIgnore of [".env", ".env.local", ".env.*.local", ".env*", "!.env.example"]) {
  if (!gitignore.split(/\r?\n/).includes(requiredIgnore)) errors.push(`Missing ${requiredIgnore} in .gitignore.`);
}

if (errors.length) {
  console.error("Environment contract check failed:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log(`Environment contract passed (${requiredNames.length} variables, no template secrets).`);
