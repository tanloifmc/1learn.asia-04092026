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
| M1: Executable foundation | in_progress | 63% | Next.js, TypeScript, lint, browser smoke checks, local environment contract | Build, local HTTP and browser smoke checks passed; repeatable browser suite remains |
| M2: Identity and account | in_progress | 45% | Auth, profile, dashboard, roles and permissions | Account preference/security source and local migration build; live user journeys remain |
| M3: Shared application core | in_progress | 58% | Notifications, favorites, media, inquiry and provider workflows | RLS and user journey suite passes |
| M4: Operations and public site | in_progress | 83% | CMS, typed public settings, header/footer, admin console, audit trail | Admin and public-page suite passes |
| M5: Membership and production | in_progress | 60% | Membership lifecycle, Resend, GitHub CI, Vercel and monitoring | Production configuration, live administrator acceptance and deployment acceptance pass |

## Active Backlog

| ID | Task | Module | Status | Completion | Depends on | Acceptance evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M0-001 | Approve core blueprint | Documentation | verified | 100% | None | User confirmation recorded 2026-08-03 |
| M1-001 | Scaffold application repository | App scaffold | review | 60% | M0-001 | Typecheck, lint, production build and local public/protected route checks passed; browser interaction suite remains |
| M1-002 | Add source folder architecture and shared configuration | App scaffold | backlog | 0% | M1-001 | Typecheck and architecture review |
| M1-003 | Configure local environment examples and secret guardrails | Operations | backlog | 0% | M1-001 | No secrets tracked; environment validation test |
| M2-001 | Implement database migration baseline and RLS policy framework | Data/Auth | review | 50% | M1-001 | Two migrations applied; all 16 core tables have RLS and security advisors pass | Run authenticated cross-user RLS isolation tests |
| M2-002 | Implement register, login, logout, verification and password recovery | Auth | review | 25% | M2-001 | UI and callback source built; live auth journey awaits Supabase connection |
| M2-003 | Implement profiles, dashboard and RBAC | Account/Roles | review | 25% | M2-002 | Dashboard, profile API and RBAC migration built; live role isolation awaits database |
| M3-001 | Implement notifications and favorites | Shared core | review | 25% | M2-003 | Source/API/UI build passed; cross-account RLS and browser acceptance remain |
| M3-002 | Implement provider organization and inquiry flow | Provider/Inquiries | review | 35% | M2-003 | Profile, review, inbox and send-inquiry UI/API routes passed typecheck, lint and production build; live role tests remain |
| M4-001 | Implement design system, layouts and navigation settings | Design/CMS | review | 25% | M1-002 | Typecheck, lint and production build passed; desktop and mobile visual checks remain |
| M4-002 | Implement CMS, app settings, admin console and audit logs | Admin/CMS | review | 25% | M2-003 | CMS/settings APIs and protected admin forms passed typecheck, lint and production build; audit and operational modules remain |
| M5-001 | Implement reusable membership lifecycle | Membership | in_progress | 45% | M2-003 | Plans, currency-neutral pricing and administrator activation/renewal source are implemented; live acceptance remains |
| M5-002 | Implement Resend transactional emails | Email | review | 25% | M2-002 | Server-only send helper and signed webhook recorder passed typecheck/lint; sandbox delivery remains |
| M5-003 | Configure GitHub CI, Vercel environments and monitoring | Operations | review | 55% | M1-001 | Remote GitHub quality gate, Vercel project/preview environment and Next.js preview deployment pass; production configuration remains |

## External Access Blockers

| Area | Status | What is needed | Impact |
| --- | --- | --- | --- |
| Supabase | deployed | All six CORE-1 migrations are remote and security advisors report no issues | Live Auth/RLS acceptance |
| GitHub | verified | `codex/core-foundation` is pushed through commit `fe2a0de`; remote Quality Gate passed for both release commits | Configure branch protection and merge/release policy |
| Vercel | preview deployed | `core-platform` project has Supabase preview variables and a successful Next.js preview deployment | Configure production variables/domain and production acceptance |

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

## Update Protocol

1. Before code: move one task to `in_progress`, then confirm contracts and acceptance criteria.
2. During code: update its feature rows and module percentage only when evidence changes.
3. Before handoff: run the required specialist checks and record their result in the module document.
4. After acceptance: mark the task `verified`; then select the next ready task.

## Current Release Policy

Release batch `CORE-1` includes M1 through M5: app foundation, identity, shared core modules, public/CMS/admin operations, generic membership lifecycle, Resend integration and deployment configuration. From 2026-08-03 onward, all pending source and migration changes remain local until `CORE-1` is accepted as one release. GitHub push, further Supabase migration pushes and Vercel deployment happen together at the release gate.

The two baseline migrations already deployed to project `Travel Plan` are frozen remote state. No additional remote database changes are permitted before `CORE-1` release acceptance.
