# Project Board

This is the operating board for the core platform. Every task has one owner (the current implementation agent), one status, clear acceptance evidence, and an updated completion percentage.

## Status Values

| Status | Meaning |
| --- | --- |
| `backlog` | Approved idea, not scheduled |
| `ready` | Contract and acceptance criteria are clear |
| `in_progress` | Actively being implemented; only one core task may hold this status |
| `review` | Code is ready for verification |
| `verified` | Acceptance evidence is recorded |
| `blocked` | Cannot proceed without a decision or external access |

## Delivery Milestones

| Milestone | Status | Completion | Goal | Exit evidence |
| --- | --- | --- | --- | --- |
| M0: Blueprint | verified | 100% | Canonical docs and delivery process | User approved the platform direction on 2026-08-03 |
| M1: Executable foundation | in_progress | 88% | Next.js, TypeScript, lint, committed browser suite, local environment contract | M1-001/M1-003 and the first source-boundary scope are remotely verified; further module migration is incremental |
| M2: Identity and account | in_progress | 62% | Auth, profile, dashboard, roles and permissions | Live browser login/logout/dashboard/profile/preferences/password and user/admin RLS baseline pass; registration, recovery and multi-role journeys remain |
| M3: Shared application core | in_progress | 72% | Notifications, favorites, media, inquiry and provider workflows | Provider onboarding, inquiry and administrator moderation journeys pass; broader operations remain |
| M4: Operations and public site | in_progress | 86% | CMS, typed public settings, header/footer, admin console, audit trail and reusable UI primitives | Admin provider moderation now has live browser evidence; CMS/settings suite remains |
| M5: Membership and production | in_progress | 70% | Membership lifecycle, Resend, GitHub CI, Vercel and monitoring | Production configuration, public-preview access policy, Resend sandbox delivery, membership renewal and deployment acceptance pass |

## Active Backlog

| ID | Task | Module | Status | Completion | Depends on | Acceptance evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M0-001 | Approve core blueprint | Documentation | verified | 100% | None | User confirmation recorded 2026-08-03 |
| M1-001 | Scaffold application repository | App scaffold | verified | 100% | M0-001 | Local and GitHub CI typecheck, lint, production build, audit and six Playwright desktop/mobile public/protected-route/login-control tests pass |
| M1-002 | Add source folder architecture and shared configuration | App scaffold | verified | 50% | M1-001 | `account` and `settings` are real feature modules; GitHub Quality Gate `30884673478` passed environment contract, typecheck, lint, build and 4 Playwright tests |
| M1-003 | Configure local environment examples and secret guardrails | Operations | verified | 100% | M1-001 | Local and GitHub CI environment-contract validation passes |
| M2-001 | Implement database migration baseline and RLS policy framework | Data/Auth | review | 60% | M1-001 | Live Supabase acceptance proves profile, role, favorite and notification RLS isolation plus administrator visibility; other tables remain |
| M2-002 | Implement register, login, logout, verification and password recovery | Auth | review | 50% | M2-001 | Gated live browser suite passes email/password login, logout and post-logout denial on desktop/mobile; registration, verification and recovery remain |
| M2-003 | Implement profiles, dashboard and RBAC | Account/Roles | review | 65% | M2-002 | Live desktop/mobile journey saves profile, notification preferences and replacement password, while dashboard role and profile isolation/administrator visibility pass; multi-role routes remain |
| M3-001 | Implement notifications and favorites | Shared core | review | 45% | M2-003 | Live owner-only favorite/notification creation and cross-account read denial pass; browser interaction and mutation coverage remain |
| M3-002 | Implement provider organization and inquiry flow | Provider/Inquiries | review | 75% | M2-003 | Live provider, inquiry and admin-moderation suites pass onboarding, role assignment, review, sender inquiry, provider inbox update and admin approval notification on desktop/mobile |
| M4-001 | Implement design system, layouts and navigation settings | Design/CMS | verified | 40% | M1-002 | Shared accessible button, form field, status message and empty state are used in login/support; GitHub Quality Gate `30885182320` passes typecheck, lint, build and 6 desktop/mobile Playwright tests |
| M4-002 | Implement CMS, app settings, admin console and audit logs | Admin/CMS | review | 25% | M2-003 | CMS/settings APIs and protected admin forms passed typecheck, lint and production build; audit and operational modules remain |
| M5-001 | Implement reusable membership lifecycle | Membership | review | 70% | M2-003 | Live desktop/mobile suite proves administrator plan creation, user selection, activation, suspension, reactivation and the separate member account's current-subscription state; plan deletion and renewal extension remain |
| M5-002 | Implement Resend transactional emails | Email | review | 25% | M2-002 | Server-only send helper and signed webhook recorder passed typecheck/lint; sandbox delivery remains |
| M5-003 | Configure GitHub CI, Vercel environments and monitoring | Operations | review | 60% | M1-001 | Remote GitHub quality gate and Vercel preview deployment of 66 routes pass; Vercel Authentication currently protects external preview HTTP checks |

## External Access Blockers

| Area | Status | What is needed | Impact |
| --- | --- | --- | --- |
| Supabase | deployed | All six CORE-1 migrations are remote and security advisors report no issues | Live Auth/RLS acceptance |
| Supabase email | blocked | The linked project's signup confirmation endpoint returned `429 over_email_send_rate_limit` on 2026-08-04 | Registration, verification and recovery delivery cannot be live-accepted until a sender/rate-limit configuration is available |
| GitHub | verified | `codex/core-foundation` is pushed through commit `e0e4c6b`; remote Quality Gate passed for the latest browser-auth tooling change | Configure branch protection and merge/release policy |
| Vercel | preview deployed | `core-platform` preview `core-platform-h84uyana7-le-nguyen2004.vercel.app` built 66 routes from commit `84751dc` | Decide whether preview protection stays enabled; configure production variables/domain and production acceptance |

## Current Evidence

| Date | Task | Result | Evidence | Remaining |
| --- | --- | --- | --- | --- |
| 2026-08-03 | M1-001 | Partial pass | Direct TypeScript check, ESLint check and Next.js production build passed | Start local dev server and complete browser check; add test harness |
| 2026-08-03 | M2-001 to M2-003 | Partial pass | TypeScript, ESLint and production build passed after Supabase SSR/Auth integration, logout and account profile UI | Authenticate Supabase CLI, push migration, then run live auth and RLS acceptance |
| 2026-08-03 | M2-001 | Partial pass | Both migrations pushed; all 16 core tables have RLS; security advisors report no issues; function execute access verified revoked | Run authenticated cross-user RLS isolation tests |
| 2026-08-03 | M3-001 | Partial pass | Favorites and notification API routes, inbox/list UI and dashboard links passed typecheck, lint and production build | Run two-account RLS and browser acceptance in CORE-1 release gate |
| 2026-08-03 | M3-002 | Partial pass | Provider organization, review submission and inquiry API routes passed typecheck, lint and production build | Add provider UI journey, service-role environment and live two-account tests |
| 2026-08-03 | M4-001 | Partial pass | Shared CSS tokens, responsive public header/footer, account sidebar and public placeholder routes passed typecheck, lint and production build | Add reusable components and run desktop/mobile browser acceptance |
| 2026-08-03 | M4-002 | Partial pass | CMS public read APIs, editor/admin content API, administrator settings API, server-side role guards and protected forms passed typecheck, lint and production build | Add operational admin modules, audit logs and browser role/publishing acceptance |
| 2026-08-03 | M3-002 | Partial pass | Provider profile/review UI, provider inbox, user send-inquiry form and sent-inquiries page passed typecheck, lint and production build | Configure service role and run two-account provider/user browser and RLS acceptance |
| 2026-08-04 | M5-001 | In progress | Removed application-specific payment adapter; added generic plans and administrator membership lifecycle | Typecheck, lint, build, migration push and live administrator acceptance |
| 2026-08-03 | M1-001 | Partial pass | Local server returned 200 for public auth/pricing routes and 307 `/login` redirects for unauthenticated dashboard/admin routes | Interactive browser and authenticated acceptance remain |
| 2026-08-03 | M4-002 | Partial pass | Admin user/role, provider moderation and audit viewer screens plus guarded APIs passed typecheck, lint and production build | Run multi-role acceptance and add billing operations view |
| 2026-08-04 | M5-003 | Partial pass | GitHub Actions `Quality Gate` completed successfully for commits `427d49d` and `fe2a0de`; Vercel preview built all 69 routes | Configure production domain/variables, monitoring and production acceptance |
| 2026-08-04 | M5-001 | Partial pass | Generic membership refactor passed TypeScript, ESLint, production build and zero-vulnerability audit; migration `20260804110000` is remote and security advisors report no issues | Run live administrator and member acceptance |
| 2026-08-04 | M5-001 | Verified | `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-membership` passed 2/2 desktop/mobile: an administrator creates a plan, selects a user, activates membership, then a separate member browser session reads the active plan. Temporary users, plans and subscriptions are deleted | Add suspension/reactivation and plan-deletion browser coverage |
| 2026-08-04 | M5-001 | Verified | The live membership suite now also suspended the generated subscription, confirmed the member's active-state panel disappeared, reactivated it and confirmed the panel returned. It passed 2/2 desktop/mobile and temporary data was deleted | Add renewal-extension and plan-deletion browser coverage |
| 2026-08-04 | M2-002 | Blocked | Live `/register` UI acceptance reached the real Supabase signup endpoint but received `429 over_email_send_rate_limit`; no account was created | Configure Supabase/Resend sender and email rate limit, then run the gated registration suite |
| 2026-08-04 | M2-003 | Verified | `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-account` passed 2/2 desktop/mobile: a confirmed user logged in, saved profile fields and notification preferences, and the test verified both records in Supabase before deleting the user | Add avatar, password/session and role-specific acceptance |
| 2026-08-04 | M2-003 | Verified | The live account suite now also changed the authenticated user's password, signed out and proved the replacement password could sign in. It passed 2/2 desktop/mobile and deleted temporary users | Add avatar, session-management and role-specific acceptance |
| 2026-08-04 | M5-003 | Partial pass | GitHub `Quality Gate` passed for `6bcd8f4`; Vercel preview `core-platform-hqsiv0q3h-le-nguyen2004.vercel.app` built 66 routes | Configure project-specific production domain/variables, monitoring and production acceptance |
| 2026-08-04 | M1-001 | Partial pass | Committed Playwright suite passed 4/4 desktop/mobile public-shell and anonymous protected-route tests; TypeScript, ESLint, build and audit also pass | Verify the updated suite in remote CI; add authenticated and RLS tests |
| 2026-08-04 | M1-001 | Verified | GitHub Quality Gate `30883245757` passed typecheck, lint, production build, Chromium installation and 4 Playwright tests | Authenticated and RLS tests belong to later identity/shared-core acceptance |
| 2026-08-04 | M1-003 | Partial pass | `npm run check:env` validated eight required environment variables, blank template secrets, ignore rules and absence of removed gateway variables; TypeScript, ESLint and audit pass | Verify the new CI step remotely |
| 2026-08-04 | M1-003 | Verified | GitHub Quality Gate `30883719197` passed environment contract, typecheck, lint, build and Playwright on a clean runner | Keep the contract synchronized when integrations are added |
| 2026-08-04 | M1-002 | Partial pass | `account` and `settings` moved into `src/features`; local environment contract, TypeScript, ESLint, production build (66 routes), 4 desktop/mobile Playwright tests and zero-vulnerability audit pass | Push and verify this architectural change in GitHub CI; migrate remaining capabilities incrementally |
| 2026-08-04 | M1-002 | Verified | GitHub Quality Gate `30884673478` passed `npm ci`, environment contract, typecheck, lint, production build, Chromium installation and 4 Playwright tests for commit `77a8c4c` | Migrate remaining capabilities incrementally when their phase changes them |
| 2026-08-04 | M4-001 | Partial pass | Added reusable accessible UI primitives (button, form field, status message, empty state), applied them to login/support and expanded Playwright to 6 desktop/mobile tests; local contract, typecheck, lint, build and audit pass | Verify the expanded suite in GitHub CI; add table, modal, toast and protected-screen acceptance |
| 2026-08-04 | M4-001 | Verified | GitHub Quality Gate `30885182320` passed `npm ci`, environment contract, typecheck, lint, production build, Chromium installation and all 6 Playwright tests for commit `84ee30c` | Add table, modal, toast and protected-screen acceptance |
| 2026-08-04 | M2-001, M2-002, M2-003, M3-001 | Partial pass | `RUN_LIVE_AUTH_RBAC=true npm run test:live:auth-rbac` passed against linked Supabase: temporary confirmed password sign-in, default user role, user isolation for profiles/roles/favorites/notifications, and administrator profile visibility; both temporary users were deleted | Add browser registration/logout/recovery and provider/editor/RLS workflows |
| 2026-08-04 | M2-002, M2-003 | Partial pass | `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-auth` passed 2/2 desktop/mobile: real browser login, dashboard/default role, logout and post-logout `/dashboard` denial. Temporary users were deleted | Add browser registration, verification, recovery and provider/editor/admin journeys |
| 2026-08-04 | M5-003 | Partial pass | Vercel preview `core-platform-h84uyana7-le-nguyen2004.vercel.app` built 66 routes successfully from `84751dc`; external HTTP checks encounter Vercel Authentication before the application | Preserve or change preview-protection policy deliberately; then run application HTTP checks and production acceptance |
| 2026-08-04 | M1-001 | Verified | GitHub Quality Gate `30886692600` passed `npm ci`, environment contract, typecheck, lint, production build and six public Playwright tests; two secret-gated live tests skipped as intended | Keep live suites explicit and guarded; add provider/editor/admin journeys in their phases |
| 2026-08-04 | M3-002 | Partial pass | `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-provider` passed 2/2 desktop/mobile: create provider profile, automatic provider role, submit review and provider role in dashboard. Temporary organizations and users were deleted | Add provider inquiry and administrator moderation browser/RLS journeys |
| 2026-08-04 | M3-002 | Partial pass | `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-inquiries` passed 2/2 desktop/mobile: sender submits inquiry, provider reads inbox and changes it to `read`. Temporary inquiries, organizations and users were deleted | Add administrator moderation and notification browser/RLS journeys |
| 2026-08-04 | M3-002, M4-002 | Partial pass | `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-admin-provider` passed 2/2 desktop/mobile: administrator approves provider and provider receives the generated notification. Temporary organizations and users were deleted | Add CMS/settings/admin-user browser acceptance |

## Update Protocol

1. Before code: move one task to `in_progress`, then confirm contracts and acceptance criteria.
2. During code: update its feature rows and module percentage only when evidence changes.
3. Before handoff: run the required specialist checks and record their result in the module document.
4. After acceptance: mark the task `verified`; then select the next ready task.

## Current Release Policy

Release batch `CORE-1` includes M1 through M5: app foundation, identity, shared core modules, public/CMS/admin operations, generic membership lifecycle, Resend integration and deployment configuration. Source changes are pushed only after local quality evidence is recorded, and their GitHub Quality Gate becomes the release evidence. Supabase migrations are pushed only after their local contract and migration review are complete.

All six CORE-1 migrations currently in `supabase/migrations` are deployed to the linked Supabase project. Future schema changes must be new ordered migrations; deployed migrations are immutable remote state.
