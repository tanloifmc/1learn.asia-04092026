export default function globalSetup() {
  const e2eEnvironment = process.env.E2E_ENV;
  if (e2eEnvironment !== "development" && e2eEnvironment !== "staging") {
    throw new Error("E2E tests are restricted to an explicitly approved development or staging environment.");
  }

  const writeApprovalName = `E2E_ALLOW_${e2eEnvironment.toUpperCase()}_TEST_WRITES`;
  if (process.env[writeApprovalName] !== "true") {
    throw new Error(`E2E write tests require ${writeApprovalName}=true.`);
  }
}
