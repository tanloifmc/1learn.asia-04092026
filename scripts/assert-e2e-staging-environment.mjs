const requiredNames = [
  'E2E_ENV',
  'E2E_BASE_URL',
  'E2E_SUPABASE_URL',
  'E2E_SUPABASE_PROJECT_REF',
  'E2E_SUPABASE_PUBLISHABLE_KEY',
  'E2E_SUPABASE_SERVICE_ROLE_KEY',
];

const missing = requiredNames.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Missing required non-production E2E variables: ${missing.join(', ')}`);
}

const e2eEnvironment = process.env.E2E_ENV;
if (e2eEnvironment !== 'development' && e2eEnvironment !== 'staging') {
  throw new Error('E2E write tests require E2E_ENV=development or E2E_ENV=staging.');
}

const writeApprovalName = `E2E_ALLOW_${e2eEnvironment.toUpperCase()}_TEST_WRITES`;
if (process.env[writeApprovalName] !== 'true') {
  throw new Error(`E2E write tests require ${writeApprovalName}=true.`);
}

const projectRef = new URL(process.env.E2E_SUPABASE_URL).hostname.split('.')[0];
if (
  projectRef !== process.env.E2E_SUPABASE_PROJECT_REF
  || (process.env.E2E_PRODUCTION_SUPABASE_PROJECT_REF && projectRef === process.env.E2E_PRODUCTION_SUPABASE_PROJECT_REF)
  || (process.env.E2E_PRODUCTION_BASE_URL && new URL(process.env.E2E_BASE_URL).origin === new URL(process.env.E2E_PRODUCTION_BASE_URL).origin)
) {
  throw new Error('E2E Supabase URL must exactly match the explicit non-production project reference.');
}

if (
  e2eEnvironment === 'staging'
  && (!process.env.E2E_PRODUCTION_SUPABASE_PROJECT_REF || !process.env.E2E_PRODUCTION_BASE_URL)
) {
  throw new Error('Staging E2E requires explicit production project and application references.');
}

console.log(`${e2eEnvironment} E2E environment approved.`);
