# Module: Account

## Purpose

Allow every authenticated user to manage their own profile, preferences, security, notifications, favorites, and billing entry points.

## Completion

Current completion: 30%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Account dashboard | implemented | 25% | User sees account summary after login |
| Profile editing | implemented | 25% | User can update display name, avatar, phone, locale, timezone |
| Preferences | implemented | 25% | User can update notification and localization preferences |
| Security settings | planned | 0% | User can access password/session settings |
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
Notes: The profile API and account-editing UI are implemented. On 2026-08-04, the gated live check verified each temporary user can read only their own profile, while a temporary administrator can read a managed profile. Profile edit and preference browser acceptance remain.
