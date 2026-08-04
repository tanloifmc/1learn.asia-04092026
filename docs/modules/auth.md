# Module: Authentication

## Purpose

Provide secure account access for all user types.

## Completion

Current completion: 35%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Email registration | implemented | 25% | User can create account, profile is created, default role is assigned |
| Email login | implemented | 45% | Live temporary-user password sign-in passes; browser dashboard redirect remains |
| Logout | implemented | 25% | Session is cleared and protected routes redirect |
| Forgot password | implemented | 25% | User receives reset link |
| Reset password | implemented | 25% | User can set a new password securely |
| Email verification | implemented | 25% | Sensitive features require verified email if enabled |
| Protected route middleware | implemented | 25% | Unauthenticated users cannot access app routes |
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
Notes: UI includes registration, login, logout, verification callback and password recovery. On 2026-08-04, the gated live Supabase check created a confirmed temporary account, verified password sign-in, then deleted it. Registration, browser login/logout, email verification and recovery flows still require their own acceptance.
