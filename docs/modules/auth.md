# Module: Authentication

## Purpose

Provide secure account access for all user types.

## Completion

Current completion: 45%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Email registration | implemented | 25% | User can create account, profile is created, default role is assigned |
| Email login | verified | 60% | Live browser login reaches the dashboard on desktop and mobile |
| Logout | verified | 60% | Live browser logout returns to login and dashboard access is denied after session removal |
| Forgot password | implemented | 25% | User receives reset link |
| Reset password | implemented | 25% | User can set a new password securely |
| Email verification | implemented | 25% | Sensitive features require verified email if enabled |
| Protected route middleware | verified | 65% | Anonymous and post-logout browser access to the dashboard redirects to login |
| Role-aware redirect | planned | 0% | User, provider, editor, and admin land in the right area |
| Session refresh | implemented | 25% | SSR pages do not randomly lose valid sessions |

## Required Data

- `profiles`
- `user_roles`

## Required Routes

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/dashboard`

## Required Tests

- Register happy path
- Login happy path
- Logout happy path
- Forgot/reset password UI path
- Protected route redirects
- Role-aware redirects

## Verified Evidence

Verified on: 2026-08-03
Task: M2-002
Checks: direct TypeScript check, direct ESLint check, Next.js production build
Result: pass
Notes: UI includes registration, login, logout, verification callback and password recovery. On 2026-08-04, the gated browser acceptance created a confirmed temporary account, passed login/dashboard/logout/post-logout denial on desktop and mobile, then deleted the account. Registration, email verification, recovery and session-expiry flows still require their own acceptance.
