# Module: Admin Console

## Purpose

Give application operators a complete control center for users, providers, content, billing, settings, and audit logs.

## Completion

Current completion: 0%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Admin dashboard | planned | 0% | Admin sees key operational summaries |
| User management | planned | 0% | Admin can search, view, suspend, and update users |
| Role management | planned | 0% | Admin can assign allowed roles |
| Provider management | planned | 0% | Admin can approve, reject, suspend providers |
| CMS management | planned | 0% | Editor/admin can manage content |
| Billing management | planned | 0% | Admin can manage plans and inspect payments |
| App settings management | planned | 0% | Admin can update branding, menu, footer, SEO |
| Notification broadcast | planned | 0% | Admin can send system notifications |
| Audit log viewer | planned | 0% | Admin can review sensitive actions |

## Required Data

- Most core tables

## Security Rule

Admin UI checks are not enough. Every admin API route and database policy must enforce authorization server-side.

