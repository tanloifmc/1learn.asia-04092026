# Module: Account

## Purpose

Allow every authenticated user to manage their own profile, preferences, security, notifications, favorites, and billing entry points.

## Completion

Current completion: 65%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Account dashboard | verified | 55% | Live browser login renders the dashboard and default role on desktop and mobile |
| Profile editing | implemented | 65% | User can update display name, phone, locale and timezone; live browser/database acceptance passes |
| Preferences | implemented | 65% | User can update notification preferences; loading controls prevent stale data overwrites and live browser/database acceptance passes |
| Security settings | implemented | 60% | User can change password, sign out and sign in again with the replacement password; live browser acceptance passes |
| Billing summary | planned | 0% | User sees plan and payment status |

## Required Data

- `profiles`
- `membership_subscriptions`
- `notifications`
- `favorites`

## Required Routes

- `/dashboard`
- `/account`
- `/account/security`
- `/billing`

## Verified Evidence

Verified on: 2026-08-03
Task: M2-003
Checks: direct TypeScript check, direct ESLint check, Next.js production build
Result: pass
Notes: The profile API and account-editing UI are implemented. On 2026-08-04, the gated live browser check rendered the dashboard and default role after a real login on desktop and mobile. The gated RLS check also verified each temporary user can read only their own profile, while a temporary administrator can read a managed profile. `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-account` then passed 2/2 desktop/mobile: it saved profile fields and notification preferences through the real forms and verified both records in Supabase, changed password, signed out and signed in with the replacement password. Avatar upload, session management and membership-summary acceptance remain.
