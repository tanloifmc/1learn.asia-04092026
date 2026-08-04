# Module: Admin Console

## Purpose

Give application operators a complete control center for users, providers, content, billing, settings, and audit logs.

## Completion

Current completion: 35%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Admin dashboard | implemented | 25% | Protected admin landing page and role-aware entry points compile and production-build |
| User management | planned | 0% | Admin can search, view, suspend, and update users |
| Role management | planned | 0% | Admin can assign allowed roles |
| Provider management | verified | 70% | Live desktop/mobile administrator browser test approves a pending provider and verifies the owner notification |
| CMS management | implemented | 25% | Editor/admin post API and create form compile and production-build |
| Billing management | planned | 0% | Admin can manage plans and inspect payments |
| App settings management | implemented | 25% | Admin-only settings API and JSON form compile and production-build |
| Notification broadcast | planned | 0% | Admin can send system notifications |
| Audit log viewer | planned | 0% | Admin can review sensitive actions |

## Required Data

- Most core tables

## Security Rule

Admin UI checks are not enough. Every admin API route and database policy must enforce authorization server-side.

## Verification Evidence

On 2026-08-04, `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-admin-provider` passed on desktop and mobile. It created temporary administrator/provider users and a pending organization, approved it through `/admin/providers`, verified the owner notification, then deleted all temporary data. The remaining management areas still need their own acceptance.
