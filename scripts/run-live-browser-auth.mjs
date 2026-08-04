import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

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

if (process.env.RUN_LIVE_BROWSER_AUTH !== "true") {
  throw new Error("Refusing live browser mutation. Set RUN_LIVE_BROWSER_AUTH=true to run this acceptance check.");
}

await loadLocalEnvironment();
const result = spawnSync(process.execPath, ["./node_modules/@playwright/test/cli.js", "test", "tests/e2e/live-auth.spec.ts"], {
  env: process.env,
  stdio: "inherit",
});
process.exitCode = result.status ?? 1;
