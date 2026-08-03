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
| M1: Executable foundation | in_progress | 50% | Next.js, TypeScript, lint, test harness, local environment contract | Production build passed; browser check and test harness remain |
| M2: Identity and account | in_progress | 35% | Auth, profile, dashboard, roles and permissions | Database/RLS deployed and security-verified; live user journeys remain |
| M3: Shared application core | backlog | 0% | Notifications, favorites, media, inquiry and provider workflows | RLS and user journey suite passes |
| M4: Operations and public site | backlog | 0% | CMS, settings, header/footer, admin console, audit trail | Admin and public-page suite passes |
| M5: Membership and production | backlog | 0% | SePay, Resend, GitHub CI, Vercel and monitoring | Staging webhook and deployment acceptance pass |

## Active Backlog

| ID | Task | Module | Status | Completion | Depends on | Acceptance evidence |
| --- | --- | --- | --- | --- | --- | --- |
| M0-001 | Approve core blueprint | Documentation | verified | 100% | None | User confirmation recorded 2026-08-03 |
| M1-001 | Scaffold application repository | App scaffold | review | 50% | M0-001 | Typecheck, lint and production build passed; browser check remains |
| M1-002 | Add source folder architecture and shared configuration | App scaffold | backlog | 0% | M1-001 | Typecheck and architecture review |
| M1-003 | Configure local environment examples and secret guardrails | Operations | backlog | 0% | M1-001 | No secrets tracked; environment validation test |
| M2-001 | Implement database migration baseline and RLS policy framework | Data/Auth | review | 50% | M1-001 | Two migrations applied; all 16 core tables have RLS and security advisors pass | Run authenticated cross-user RLS isolation tests |
| M2-002 | Implement register, login, logout, verification and password recovery | Auth | review | 25% | M2-001 | UI and callback source built; live auth journey awaits Supabase connection |
| M2-003 | Implement profiles, dashboard and RBAC | Account/Roles | review | 25% | M2-002 | Dashboard, profile API and RBAC migration built; live role isolation awaits database |
| M3-001 | Implement notifications and favorites | Shared core | backlog | 0% | M2-003 | RLS and UI tests |
| M3-002 | Implement provider organization and inquiry flow | Provider/Inquiries | backlog | 0% | M2-003 | User-to-provider journey; no checkout present |
| M4-001 | Implement design system, layouts and navigation settings | Design/CMS | backlog | 0% | M1-002 | Desktop and mobile visual checks |
| M4-002 | Implement CMS, app settings, admin console and audit logs | Admin/CMS | backlog | 0% | M2-003 | Permission and publishing tests |
| M5-001 | Implement SePay membership payment confirmation | Billing | backlog | 0% | M2-003 | Signed idempotent webhook test |
| M5-002 | Implement Resend transactional emails | Email | backlog | 0% | M2-002 | Sandbox delivery and webhook test |
| M5-003 | Configure GitHub CI, Vercel environments and monitoring | Operations | backlog | 0% | M1-001 | Preview deploy and production-readiness checklist |

## External Access Blockers

| Area | Status | What is needed | Impact |
| --- | --- | --- | --- |
| Supabase | blocked | Project `Travel Plan` is identified. Local CLI is outdated and OAuth login was interrupted before completion; upgrade, complete browser login, then link with the remote database password | Migration cannot be pushed and live Auth/RLS cannot be accepted |
| GitHub | blocked | Switch local Git credentials from `1weddingasia` to an account with write access to `lenguyen02042004-lang/Core-platform` | Core is committed locally but push returned GitHub 403 |
| Vercel | blocked | Authenticate Vercel CLI, then provide project environment values after Supabase is linked | A managed deployment with Supabase credentials cannot be configured |

## Current Evidence

| Date | Task | Result | Evidence | Remaining |
| --- | --- | --- | --- | --- |
| 2026-08-03 | M1-001 | Partial pass | Direct TypeScript check, ESLint check and Next.js production build passed | Start local dev server and complete browser check; add test harness |
| 2026-08-03 | M2-001 to M2-003 | Partial pass | TypeScript, ESLint and production build passed after Supabase SSR/Auth integration, logout and account profile UI | Authenticate Supabase CLI, push migration, then run live auth and RLS acceptance |
| 2026-08-03 | M2-001 | Partial pass | Both migrations pushed; all 16 core tables have RLS; security advisors report no issues; function execute access verified revoked | Run authenticated cross-user RLS isolation tests |

## Update Protocol

1. Before code: move one task to `in_progress`, then confirm contracts and acceptance criteria.
2. During code: update its feature rows and module percentage only when evidence changes.
3. Before handoff: run the required specialist checks and record their result in the module document.
4. After acceptance: mark the task `verified`; then select the next ready task.
