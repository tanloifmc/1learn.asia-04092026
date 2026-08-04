# Module: Admin Console

## Purpose

Give application operators a complete control center for users, providers, content, billing, settings, and audit logs.

## Completion

Current completion: 25%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Admin dashboard | implemented | 25% | Protected admin landing page and role-aware entry points compile and production-build |
| User management | planned | 0% | Admin can search, view, suspend, and update users |
| Role management | planned | 0% | Admin can assign allowed roles |
| Provider management | planned | 0% | Admin can approve, reject, suspend providers |
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

On 2026-08-03, TypeScript, ESLint and the Next.js production build passed with protected `/admin`, `/admin/content/posts` and `/admin/settings` routes. Browser role isolation and the remaining management areas are not yet accepted.
