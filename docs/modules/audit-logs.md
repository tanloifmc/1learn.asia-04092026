# Module: Audit Logs

## Purpose

Record important system actions for accountability and debugging.

## Completion

Current completion: 65%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Audit log table | verified | 60% | Server-only writer is exercised by a real role lifecycle; storage and retention review remain |
| Role change logging | verified | 75% | Live desktop/mobile administrator grant/revoke records the exact target user and both action names |
| Provider moderation logging | implemented | 50% | Approve/reject/suspend API writes actor, provider and status to audit logs |
| Billing action logging | implemented | 40% | Membership-plan create/update actions are logged; payment-confirmation audit and live webhook acceptance remain |
| Settings change logging | implemented | 55% | Typed branding/menu/footer/social and generic setting changes write audit records |
| CMS action logging | implemented | 50% | Post and static-page create/update/archive actions write audit records; category logging remains |
| Admin viewer | verified | 65% | Live desktop/mobile administrator journey reads the matching role add/remove records; filtering and retention tooling remain |

## Required Data

- `audit_logs`

## Verification Evidence

On 2026-08-04, TypeScript, ESLint and the Next.js production build passed after audit logging was added to post, static-page and membership-plan management.

Verified on: 2026-08-05
Task: M2-003, M4-002
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-roles`
Result: pass (2/2 desktop/mobile)
Notes: A temporary administrator granted then revoked Editor from a temporary user. The administrator audit console displayed `role.add` and `role.remove` entries for that exact target ID. Temporary accounts and audit rows were deleted. Filtering, retention and coverage of all sensitive actions remain open.
