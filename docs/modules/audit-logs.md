# Module: Audit Logs

## Purpose

Record important system actions for accountability and debugging.

## Completion

Current completion: 50%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Audit log table | implemented | 45% | Server-only write helper records important actions; storage and retention review remain |
| Role change logging | implemented | 50% | Role add/remove API writes actor, target and role to audit logs |
| Provider moderation logging | implemented | 50% | Approve/reject/suspend API writes actor, provider and status to audit logs |
| Billing action logging | implemented | 40% | Membership-plan create/update actions are logged; payment-confirmation audit and live webhook acceptance remain |
| Settings change logging | implemented | 55% | Typed branding/menu/footer/social and generic setting changes write audit records |
| CMS action logging | implemented | 50% | Post and static-page create/update/archive actions write audit records; category logging remains |
| Admin viewer | implemented | 40% | Administrator-only API and viewer pass production build; live access/filtering acceptance remains |

## Required Data

- `audit_logs`

## Verification Evidence

On 2026-08-04, TypeScript, ESLint and the Next.js production build passed after audit logging was added to post, static-page and membership-plan management. No live administrator audit-viewer acceptance has been recorded.
