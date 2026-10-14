# Production Readiness — Gate P0: Security & Test Architecture Audit

**Audit date:** 2026-09-21  
**Scope:** Public test/diagnostic routes, privileged database access, assessment validity guardrails, and the automated-test architecture.  
**Safety boundary:** No production database was queried or modified. The Supabase project configured in `.env.local` was explicitly authorized by the product owner as the development/E2E database; its package configuration was migrated and isolated test users were created only for the live E2E run.

## Gate decision

**FAIL — production/pilot expansion remains blocked.**

Build, lint, typecheck, and the environment-template contract pass. They are necessary checks, but do not compensate for two publicly exposed service-role routes, a failing locked assessment-validity contract, and a test architecture that cannot produce a reliable E2E result.

## Remediation update — 2026-09-21

The following source-level remediations have been implemented and verified:

- Deleted the four public debug routes: `api/e2e-trigger`, `api/test-ids`, `api/test-score`, and `api/test-e2e`. A fresh production build no longer lists them.
- Replaced the ambiguous straight-line configuration with the explicit `straightline_block_threshold`; added and applied migration `20260921094304_p0_assessment_validity_config` to the authorized development/E2E database. The live package `2026.1` now has the locked threshold of 8 and no longer has the obsolete `max_straightline_streak_allowed` key.
- Made the validity result `UNDETERMINED` when any required metadata is absent and enforced `INVALID` for two or more straight-line blocks. The focused unit suite now passes 51/51 tests.
- Added a dedicated `test:unit` command, removed database-mocked core-engine tests from the active suite, and made E2E writes fail closed unless an explicit development or staging approval is supplied. Development E2E can target only a loopback application URL; staging additionally requires explicit production references to prove it is different.
- Made `test:unit` a required CI step. CI runs staging E2E only when all dedicated staging secrets are configured.

**Gate remains FAIL** because the repository still has no verified end-to-end student critical journey from registration through assessment, report access, premium entitlement, goal, roadmap, and task completion. The incomplete legacy journeys must be replaced before the gate can pass.

**Current remediation progress (2026-09-22):** The authenticated student flow through onboarding, the published 121-question assessment, validity eligibility, profile/matching, analytics, server-side report snapshot, and Free Report now passes against the isolated Supabase Dev environment in both desktop and mobile browsers. Premium checkout and signed webhook settlement also pass end-to-end, including rejection of an invalid signature, provider-ID idempotency, and account-deletion cascade. A verified-source program can create a fully atomic roadmap and persist task completion in desktop and mobile browsers.

The Master Data Foundation gate has now added fail-closed source/provenance constraints, RLS policies, eligibility-revocation triggers, and an import audit trail to Dev. It also found and removed a legacy `careers` RLS policy which bypassed the new eligibility filter. The real Dev catalog has **0 production-eligible careers** and **0 career→major mappings**; Free Report therefore returns the legitimate `NO_PRODUCTION_ELIGIBLE_CAREER_CATALOG` state and clearly tells the student that no career/major/university recommendation is available yet. Gate P0 remains **FAIL**: a broad, independently reviewed, source-backed career→major→program catalog and one combined browser journey are still required before production release.

## User story under audit

A student registers, completes the assessment, receives only an eligible free or premium report, chooses a goal, receives a real roadmap, and records task progress. The system must not expose student data, create records through test routes, or claim success when any business step failed.

## Evidence collected

| Check | Command | Result |
| --- | --- | --- |
| Environment contract | `npm run check:env` | PASS — 8 expected variables present and no template secrets detected. Values were not disclosed. |
| Static quality | `npm run lint`, `npm run typecheck`, `npm run build` | PASS |
| Test runner | `npx vitest run` | FAIL — 27 files failed; Vitest attempted to load Playwright E2E suites. |
| Assessment validity contract | `npx vitest run src/features/assessment/utils/scoring.test.ts` | FAIL — 2 of 21 tests fail. |
| Playwright discovery only | `npx playwright test --list` | PASS — 92 tests in 24 files are collected; this did not run a browser or write any database data. |
| Authorized development database migration | `ALLOW_DEV_DATABASE_WRITE=true node scripts/apply-p0-assessment-validity.mjs` | PASS — transaction updated exactly one package, verified the locked policy, and recorded migration `20260921094304`. |
| Development E2E safety guard | `npm run test:e2e:development -- --list` | PASS — aborts before network access without `ALLOW_DEV_E2E_DATABASE_WRITES=true`. |
| Real browser/database E2E | `ALLOW_DEV_E2E_DATABASE_WRITES=true npm run test:e2e:development` | FAIL — first student onboarding test timed out after 90 seconds; it reached `/dashboard`, then `/login`, never `/onboarding`. Run was stopped after this gate-breaking evidence. |
| Focused real onboarding E2E after environment correction | `ALLOW_DEV_E2E_DATABASE_WRITES=true npm run test:e2e:development -- tests/e2e/core/onboarding.spec.ts` | PASS — desktop and mobile: login, 4 onboarding steps, durable database checks, reload, and cleanup. |
| Focused unit suite after remediation | `npm run test:unit` | PASS — 51 tests in 6 files. |
| Static quality after remediation | `npm run lint`, `npm run typecheck`, `npm run build` | PASS — build lists 95 routes and no longer lists the four deleted public test routes. |
| Analytics schema repair | `ALLOW_DEV_DATABASE_WRITE=true node scripts/apply-p0-analytics-schema.mjs` then `node scripts/audit-p0-analytics-schema.mjs` | PASS — V2 columns are present; direct browser INSERT policy was removed. |
| Report schema repair | `ALLOW_DEV_DATABASE_WRITE=true node scripts/apply-p0-student-reports-schema.mjs` then `node scripts/audit-p0-report-schema.mjs` | PASS — `student_reports`, foreign keys, RLS, and migration history are present in Supabase Dev. |
| Critical assessment → Free Report E2E | `ALLOW_DEV_E2E_DATABASE_WRITES=true npm run test:e2e:development -- tests/e2e/critical/student-assessment-report.spec.ts --project=desktop-chromium` | PASS — isolated user completed onboarding and all 121 published questions; a validity-eligible result, report snapshot, analytics event, and visible Free Report were verified. |
| Atomic Premium payment migration | `ALLOW_DEV_DATABASE_WRITE=true node scripts/apply-p0-atomic-membership-payment.mjs` | PASS — Dev schema now has unique transaction/provider IDs, owner-scoped pending-payment RPC, and service-only atomic settlement RPC. |
| Premium checkout → signed webhook E2E | `ALLOW_DEV_E2E_DATABASE_WRITES=true npm run test:e2e:development -- tests/e2e/critical/student-premium-payment.spec.ts --project=desktop-chromium` | PASS — a real isolated account created a pending payment from the checkout UI; invalid HMAC was rejected; one signed delivery completed payment and activated one subscription; a duplicate delivery returned `already_processed` without a second subscription. |
| Account-deletion cascade repair | `ALLOW_DEV_DATABASE_WRITE=true node scripts/apply-p0-membership-user-deletion-cascade.mjs`, then the Premium E2E rerun | PASS — test cleanup completed with no residual isolated user after subscription creation. |
| Roadmap master-data audit | `node scripts/audit-p0-premium-roadmap-schema.mjs` | FAIL — 300 careers exist but `target_requirements` has no career coverage and zero production-eligible requirements. The generator now returns an explicit insufficient-data result rather than fabricating a plan. |
| Verified-source roadmap master data | `ALLOW_DEV_DATABASE_WRITE=true node scripts/apply-seed-verified-rmit-business-requirements.mjs` | PASS — RMIT Vietnam Bachelor of Business program, Grade 12 GPA ≥ 7.0 and IELTS Academic ≥ 6.5 were stored with the official RMIT source URL, verification timestamp, and production eligibility. |
| Critical goal → roadmap → task E2E | `ALLOW_DEV_E2E_DATABASE_WRITES=true npm run test:e2e:development -- tests/e2e/critical/student-goal-roadmap-task.spec.ts --project=desktop-chromium` and `--project=mobile-chromium` | PASS — isolated student completed onboarding, selected verified major, persisted a primary goal and atomic roadmap with milestones/tasks, then completed a task through the browser; durable DB checkpoints and cleanup passed. |
| Master-data foundation migration | `ALLOW_DEV_DATABASE_WRITE=true node scripts/apply-master-data-foundation-integrity.mjs` and `...apply-close-master-data-rls-bypass.mjs` | PASS — Dev now enforces source/provenance eligibility for careers, majors, universities, programs, mappings, requirements and admission data; `master_data_import_runs` has admin-only RLS. |
| Master-data database verification | `node scripts/verify-master-data-foundation.mjs` | PASS — migration history, RLS, and source-backed RMIT program verified; a transaction probe proved material changes revoke eligibility and DB rejects an eligible record without provenance. |
| Master-data coverage audit | `node scripts/audit-master-data-foundation.mjs` | FAIL (correctly surfaced) — 0/300 eligible careers and 0 career→major mappings; 1/4,043 eligible university-major programs. This is a catalog-content blocker, not a schema failure. |
| Fail-closed Free Report E2E | `ALLOW_DEV_E2E_DATABASE_WRITES=true npm run test:e2e:development -- tests/e2e/critical/student-assessment-report.spec.ts --project=desktop-chromium` and `--project=mobile-chromium` | PASS — isolated students completed 121 real questions, received a persisted Free Report and visible honest empty-catalog state; match run persisted `NO_PRODUCTION_ELIGIBLE_CAREER_CATALOG`. |
| Match-run contract repair | `ALLOW_DEV_DATABASE_WRITE=true node scripts/apply-repair-match-runs-created-at.mjs` | PASS — fixed the real schema/code mismatch discovered by E2E: `match_runs.created_at` is now present and indexed. |

## Findings

### P0-SEC-001 — Critical: unauthenticated route can write privileged data for an arbitrary user

- **Evidence:** [`src/app/api/e2e-trigger/route.ts`](../src/app/api/e2e-trigger/route.ts) exports `POST` at line 7, accepts caller-supplied `userId` at line 9, creates a Supabase client with `SUPABASE_SERVICE_ROLE_KEY` at lines 14–18, and writes a synthetic `MOCK_ACADEMIC` requirement at line 90. It has no session, role, secret, or environment guard.
- **How to reproduce safely:** Do not execute against a deployed environment. Static reproduction is sufficient: any unauthenticated requester can send a POST JSON body containing a valid student UUID to `/api/e2e-trigger`; the route uses service-role privileges rather than the requester's identity.
- **Impact:** A public caller could initiate profile/matching/roadmap writes for another student and insert non-production data. This breaks privacy, integrity, and the project rule forbidding mock data in production.
- **Root cause:** A developer-only diagnostic route is compiled as a public production route.
- **Required remediation:** Delete this route from the application build. If a diagnostic is ever required, keep it in a test harness only; it must require an explicit non-production runtime guard and an allow-listed staging environment, never the service role through a public route.
- **Acceptance test:** A production build must not expose `/api/e2e-trigger` (404). Static CI must fail if an `app/api/**` route uses `SUPABASE_SERVICE_ROLE_KEY` without an approved webhook-authentication exception.

### P0-SEC-002 — Critical: unauthenticated route discloses assessment-result identifiers

- **Evidence:** [`src/app/api/test-ids/route.ts`](../src/app/api/test-ids/route.ts) exports an unguarded `GET`, initializes the service-role client, and returns `assessment_results.id` and `student_id` for up to ten records.
- **How to reproduce safely:** Do not call a deployed endpoint. The handler has no authorization branch before its privileged query, so an anonymous GET would receive the data when the environment variables are configured.
- **Impact:** Exposure of student-linked assessment identifiers; this is especially unacceptable for a product holding minor and psychometric-profile data.
- **Root cause:** A local debug endpoint was committed beneath `app/api`.
- **Required remediation:** Delete the route. Test fixtures must be created only by the staging test runner, then cleaned up.
- **Acceptance test:** `/api/test-ids` returns 404 in a production build and no public route selects user-linked data with a service-role client.

### P0-QUAL-001 — Critical: assessment-validity engine violates the locked product contract

- **Evidence:** The locked [Validity Specification](core_architecture/08_VALIDITY_SPECIFICATION.md) requires a straight-line block at `>= 8` scored items and an `INVALID` result for `>= 2` blocks. The implementation in [`scoring.ts`](../src/features/assessment/utils/scoring.ts) uses `max_straightline_streak_allowed` as the block threshold (lines 175–195) and never makes two blocks invalid (lines 245–254). The direct test run fails: nine identical answers yield `straightline_blocks = 0`; twelve identical answers yield `QUESTIONABLE`, not `INVALID`.
- **How to reproduce:** `npx vitest run src/features/assessment/utils/scoring.test.ts`.
- **Impact:** An invalid or low-quality assessment may still produce career guidance, contrary to the product's report-eligibility policy.
- **Root cause:** Code, test expectations, and assessment documents diverged. `05_ASSESSMENT_SCORING_MATRIX_V1.0.md` also contains an older `>= 12` rule, while `08_VALIDITY_SPECIFICATION.md` is explicitly marked FINAL LOCKED.
- **Required remediation:** Product owner/assessment owner must ratify one canonical threshold in the locked specification. Then encode all required metadata explicitly (attention answers, straight-line configuration, response-time data), implement the full matrix including `>= 2` blocks, and add table-driven tests for each matrix row. Do not merely change assertions to make the suite green.
- **Acceptance test:** The matrix test suite passes, and a staging assessment marked `INVALID` or `UNDETERMINED` cannot generate either free or premium report/matching output.

### P0-TEST-001 — Blocker: the default unit-test runner loads Playwright suites

- **Evidence:** [`vitest.config.ts`](../vitest.config.ts) contains only an alias and no include/exclude policy. `npx vitest run` imported 26 Playwright suites; they fail with "Playwright Test did not expect test.describe()/test() to be called here". CI has no `test` command and currently comments out E2E execution in [`.github/workflows/quality.yml`](../.github/workflows/quality.yml).
- **Impact:** The green CI build is not a reliable quality gate. A full test command fails before it can validate the product logic.
- **Root cause:** Vitest's default test discovery includes `tests/e2e/**/*.spec.ts`; framework boundaries and CI commands are not separated.
- **Required remediation:** Create explicit, separate commands/configurations: `test:unit`, `test:integration:staging`, and `test:e2e:staging`. Vitest must exclude `tests/e2e/**`; Playwright must be the sole runner for that directory. Make each command a required CI gate only after its non-production secrets exist.
- **Acceptance test:** `npm run test:unit` runs no Playwright file; `npm run test:e2e:staging -- --list` collects the intended journeys; CI executes both without disabled lines or manual environment substitution.

### P0-TEST-002 — Blocker: live-write E2E safety is deny-list based, not fail-closed

- **Evidence:** [`tests/e2e/helpers/test-users.ts`](../tests/e2e/helpers/test-users.ts) uses `NEXT_PUBLIC_SUPABASE_URL` and the service-role key directly. It rejects only a hard-coded production fragment or optional `PROD_SUPABASE_PROJECT_REF`. In the current local environment, `RUN_LIVE_BROWSER_AUTH` and `PROD_SUPABASE_PROJECT_REF` are absent; E2E is disabled, but the guard has no mandatory staging identity.
- **Impact:** A new production project reference, a missing environment variable, or a mistaken `.env.local` can allow write tests to create and delete users in production.
- **Root cause:** Tests inherit generic application credentials and attempt to detect production after the fact.
- **Required remediation:** Require a dedicated `E2E_ENV=staging`, `E2E_BASE_URL`, `E2E_SUPABASE_URL`, and `E2E_SUPABASE_PROJECT_REF`. Before any client is initialized, require exact equality with an allow-listed staging ref and reject all other values. Never use generic `NEXT_PUBLIC_*` or production secrets for test writes.
- **Acceptance test:** A unit test proves the helper aborts before any network client is created for missing, production, or unrecognised project refs; it runs only for the declared staging ref.

### P0-TEST-003 — High: the claimed student E2E journeys are incomplete or non-deterministic

- **Evidence:** [`tests/e2e/full-student-flow.spec.ts`](../tests/e2e/full-student-flow.spec.ts) stops before submission/report/goal assertions. [`tests/e2e/full-student-journey.spec.ts`](../tests/e2e/full-student-journey.spec.ts) creates a random email but does not create an account or assert a result. [`tests/e2e/playwright-validation.spec.ts`](../tests/e2e/playwright-validation.spec.ts) relies on named accounts and a fixed password, captures screenshots, and has no staging isolation.
- **Impact:** The repository lists a complete student journey but does not prove registration, all assessment answers, free report, payment confirmation, premium gate, goal, roadmap, or task persistence.
- **Required remediation:** Replace these with one isolated, staged, data-backed critical journey and distinct payment/webhook integration tests. Every test must assert durable database checkpoints and visible user outcomes, then delete only its own fixture users.
- **Acceptance test:** One `student-critical-flow.spec.ts` passes in both desktop and mobile projects with the following checkpoints: account created, onboarding persisted, 121 responses persisted, validity eligible, report snapshot created, premium access denied before payment and granted after one verified sandbox webhook, goal persisted, roadmap/milestone/task persisted, and task completion persisted.

### P0-TEST-004 — Resolved: local test server lacked network access to Supabase

- **Evidence:** The browser generated a valid Supabase auth cookie and an isolated `@supabase/ssr` server client verified the same cookie. The local Next server's `getClaims()` reported `fetch failed` because it was launched inside the restricted sandbox. Running the same production build with network access made the real onboarding test pass on desktop and mobile.
- **Resolution:** No application authentication code was changed. The development E2E procedure now requires a local server that can reach the configured non-production Supabase project.
- **Acceptance test:** `ALLOW_DEV_E2E_DATABASE_WRITES=true npm run test:e2e:development -- tests/e2e/core/onboarding.spec.ts` passes in desktop and mobile projects against the authorized development database.

### P1-DATA-002 — High: deployed analytics schema is behind the application contract

- **Evidence:** A successful onboarding emitted `ONBOARDING_COMPLETED`, but the live adapter received `PGRST204: Could not find the 'event_version' column of 'analytics_events' in the schema cache`. The application and [`20260828000000_phase10_analytics_v2.sql`](../supabase/migrations/20260828000000_phase10_analytics_v2.sql) require this column.
- **Impact:** Product analytics are silently dropped after onboarding and potentially after other business events. This obscures production monitoring and funnel verification.
- **Required remediation:** Reconcile the remote schema with the versioned analytics migration using a new, non-destructive migration after confirming the remote table and migration history. Also regenerate [`src/types/supabase.ts`](../src/types/supabase.ts) from the corrected database schema.
- **Acceptance test:** A real onboarding creates exactly one `ONBOARDING_COMPLETED` event with `event_version = 'v1'` and the analytics adapter logs no database error.

### P1-FLOW-001 — High: goal and roadmap code can report success after incomplete work

- **Evidence:** [`set-goal-action.ts`](../src/features/career/actions/set-goal-action.ts) catches roadmap-generation errors and returns `{ success: true }` (lines 67–79). [`roadmap-generator.ts`](../src/features/roadmap/engine/roadmap-generator.ts) fabricates a `system_default` requirement when verified requirements are absent (lines 59–75), ignores milestone insert errors (line 162), and does not check task insertion errors.
- **Impact:** A student can be told a goal/roadmap exists when the roadmap is absent or incomplete; generic invented requirements breach the data-provenance rule.
- **Required remediation:** Treat generation as an atomic business outcome: either persist a fully verified roadmap or return a recoverable error. Use verified target requirements only; if they do not exist, show an explicit “insufficient verified data” state. Use a database transaction/RPC for archival plus creation, and return/check every insert error.
- **Acceptance test:** In staging, deliberately reject a requirement/milestone/task insert and verify the UI does not claim success and no partial active roadmap remains.

### P1-PAY-001 — High: payment activation lacks demonstrated idempotency/atomicity

- **Evidence:** [`sepay-payment/route.ts`](../src/app/hooks/sepay-payment/route.ts) fetches a pending transaction, updates it, then inserts a subscription in separate calls. The `payment_transactions` migration lacks a unique provider-transfer ID, transaction-code uniqueness, or an atomic payment-processing RPC.
- **Impact:** Concurrent or retried valid webhooks could race and create duplicate active subscriptions. The signature check is a positive control, but it does not establish idempotent processing.
- **Required remediation:** Persist the provider transfer ID and process one payment through a single database transaction/RPC protected by a unique constraint. Test normal, repeated, concurrent, insufficient, malformed, expired-signature, and invalid-signature cases on staging.
- **Acceptance test:** Two concurrent deliveries of the same signed sandbox webhook produce exactly one completed payment and one active subscription.

### P0-DATA-003 — Critical: the existing career-to-education catalog has no production-eligible chain

- **Evidence:** The post-migration Dev audit records 300 careers but zero production-eligible careers, 378 majors but only one eligible major, 4,043 university-major records but only one eligible program, and zero `career_major_mappings`. Before the new gate, 4,042 of 4,043 program records had neither a source URL nor verification time.
- **Impact:** It is unsafe to present a career, major, university, or Premium pathway as an evidence-based recommendation. The old status-only filtering could create an authoritative-looking but unsupported result.
- **Root cause:** Bulk catalog imports stored identity links but not record-level source provenance or reviewed career-to-major relationships. Existing JSON `education_paths` is not a verified relational mapping.
- **Remediation applied:** Migration `20260922134140_master_data_foundation_integrity` adds eligibility fields for both relationship tables, provenance constraints, partial indexes, RLS policies and automatic eligibility revocation on material change. Migration `20260922134708_close_master_data_rls_bypass` removes a legacy public career-read policy found in the live schema. Matching and Major Engine now use only verified relational edges, and no match writes an unqualified successful state when the catalog is unavailable.
- **Remaining release blocker:** Import and independently review a representative source-backed Vietnamese catalog. Every row must have source, URL, verification time, appropriate status and eligibility; each displayed pathway must prove career → major → university program. Do not bulk-upgrade old records.

## Required remediation order

1. Remove `api/e2e-trigger` and `api/test-ids` from the application build; confirm 404 in a production build.
2. Separate test runners and introduce explicit staging-only credentials with an allow-list guard.
3. Reconcile and implement the locked assessment-validity matrix; make its direct suite pass.
4. Repair P0-TEST-004 using the existing isolated-user test; then replace incomplete E2E tests with one isolated student critical journey and payment-webhook tests.
5. Make goal/roadmap and payment processing atomic and provenance-safe before testing their success claims.

## Gate completion criteria

Gate P0 may be marked **PASS** only when every P0 issue above is remediated, the complete real browser/database journey passes, CI enforces the unit and dedicated staging commands, and the evidence is attached to a new audit run. Before launch, the present development database must be separated from production and staging credentials must be configured. The next gate is not started until then.

## Files changed by this audit

- `docs/PRODUCTION_P0_SECURITY_TEST_AUDIT.md` — added the evidence-backed Gate P0 audit report.
