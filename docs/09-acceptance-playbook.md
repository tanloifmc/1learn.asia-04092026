# Acceptance Playbook

No feature is considered complete because its screen appears to work once. Completion requires evidence appropriate to its risk.

## Evidence Levels

| Level | Required evidence | Typical tools |
| --- | --- | --- |
| Code | Typecheck and production build | TypeScript, Next.js build |
| Behaviour | Happy path and validation errors | Playwright |
| Permission | Allowed role works; forbidden role is denied | Playwright plus Supabase RLS tests |
| Integration | Realistic sandbox request and duplicate-delivery behaviour | API/integration tests |
| Visual | Desktop and mobile pages have no overflow, overlap or missing states | Playwright screenshots |
| Production | Preview deployment and environment check | Vercel deployment checks |

## Minimum Acceptance by Module

| Module | Required acceptance |
| --- | --- |
| Auth | Register, verify, login, logout, password recovery, protected-route denial and session expiry handling |
| Account and roles | Profile update, role-aware dashboard, prohibited role access, RLS isolation |
| Notifications and favorites | Own records visible; another account cannot read, edit or delete them |
| Provider and inquiries | Provider lifecycle, inquiry delivery, notification/email, no provider checkout endpoint or UI |
| CMS and settings | Draft is private, published content is public, editor/admin limits, header/footer changes render correctly |
| Membership | Plan management, administrator activation/renewal/suspension, member read access and audit record |
| Email | Verified sender, template render, sandbox send, webhook signature when event tracking is enabled |
| Admin and audit | Authorization denial, every sensitive change creates a correct audit record |

## Automated Baseline

The committed Playwright suite currently covers desktop and mobile rendering of the public shell, horizontal-overflow regression, anonymous denial for `/dashboard` and `/admin`, and labelled login controls. Authenticated user, provider, editor and administrator journeys remain separate acceptance work and must use real Supabase accounts.

## Live Supabase Auth/RLS Check

Run `npm run test:live:auth-rbac` only with `RUN_LIVE_AUTH_RBAC=true`. The script loads local Supabase configuration, creates two temporary confirmed users, verifies password sign-in, profile and role isolation, favorite and notification isolation, and administrator access. It always deletes those users in `finally`, does not print credentials, and must never run in public CI.

Run `npm run test:live:browser-auth` only with `RUN_LIVE_BROWSER_AUTH=true`. The guarded Playwright suite creates one temporary confirmed user, proves login through the real browser form, dashboard access with the default role, logout and post-logout protected-route denial, then deletes the user. It also must never run in public CI.

Run `npm run test:live:browser-provider` only with `RUN_LIVE_BROWSER_AUTH=true`. It creates one temporary user, proves provider-profile creation, automatic provider-role assignment, review submission and role-aware dashboard rendering, then deletes the organization before deleting the user. It must never run in public CI.

Run `npm run test:live:browser-inquiries` only with `RUN_LIVE_BROWSER_AUTH=true`. It creates temporary sender/provider users and an approved provider organization, proves inquiry submission and provider inbox status update in separate browser sessions, then deletes the inquiry, organization and users. It must never run in public CI.

## Evidence Record Format

Add this short record to the relevant module file whenever a task reaches `verified`:

```text
Verified on: YYYY-MM-DD
Task: Mx-xxx
Checks: command or specialist tool names
Result: pass
Notes: relevant limitation or follow-up
```

## Release Gate

Before first production launch, all M1 through M5 tasks required for the released scope must be `verified`; no high-severity security issue may remain open; database backup/recovery and incident instructions must be documented; and the owner must explicitly approve production deployment.
