# Module: Audit Logs

## Purpose

Record important system actions for accountability and debugging.

## Completion

Current completion: 70%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Audit log table | implemented | 65% | Server-only writer and bounded query API are exercised by a real role lifecycle; ordered query indexes are in a local migration pending final deployment |
| Role change logging | verified | 75% | Live desktop/mobile administrator grant/revoke records the exact target user and both action names |
| Provider moderation logging | implemented | 50% | Approve/reject/suspend API writes actor, provider and status to audit logs |
| Billing action logging | implemented | 40% | Membership-plan create/update actions are logged; payment-confirmation audit and live webhook acceptance remain |
| Settings change logging | implemented | 55% | Typed branding/menu/footer/social and generic setting changes write audit records |
| CMS action logging | implemented | 50% | Post and static-page create/update/archive actions write audit records; category logging remains |
| Admin viewer | verified | 75% | Live desktop/mobile administrator journey reads the matching role records and filters by action/entity type in 25-record pages; retention and richer filters remain |

## Required Data

- `audit_logs`

## Verification Evidence

On 2026-08-04, TypeScript, ESLint and the Next.js production build passed after audit logging was added to post, static-page and membership-plan management.

Verified on: 2026-08-05
Task: M2-003, M4-002
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-roles`
Result: pass (2/2 desktop/mobile)
Notes: A temporary administrator granted then revoked Editor from a temporary user. The administrator audit console displayed `role.add` and `role.remove` entries for that exact target ID. Temporary accounts and audit rows were deleted. Filtering, retention and coverage of all sensitive actions remain open.

Verified on: 2026-08-05
Task: M4-002
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-roles`
Result: pass (2/2 desktop/mobile)
Notes: The same administrator entered `role.remove` and `user_role` in the audit filter and received the matching target record from the protected API. `20260805035209_add_audit_log_query_indexes.sql` is intentionally local until the final Supabase migration release; retention and richer filters remain open.
