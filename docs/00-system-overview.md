# System Overview

## Product Direction

This project is a reusable application core platform. It is not tied to a single domain such as travel.

The platform should provide all common foundation features required by modern web applications:

- Authentication and account management
- User profiles
- Provider or organization accounts
- Admin and editor operations
- Role-based permissions
- Application settings
- Design system
- Public website pages
- CMS for pages, blog posts, categories, and SEO
- Notifications inbox
- Favorites and saved items
- Contact and inquiry flows
- Membership plans and payment confirmation
- Audit logs
- Media storage
- Testing and verification workflows
- Transactional email delivery and email-event tracking
- Deployment, environment management, monitoring, and operational recovery

Domain modules should be added later without rewriting the core.

## Account Types

| Account type | System role | Purpose |
| --- | --- | --- |
| End user | `user` | Uses the application, saves items, receives notifications, manages personal profile and membership |
| Provider | `provider` | Represents a business, partner, seller, creator, vendor, or service provider |
| Editor | `editor` | Manages content and moderate selected records |
| Admin | `admin` | Manages users, providers, content, plans, settings, payments, and operational data |
| Super admin | `super_admin` | Full system owner role reserved for trusted application operators |

## Core Principles

- Build complete modules one at a time.
- Avoid domain-specific assumptions in core modules.
- Use clear data contracts before implementing code.
- Keep one canonical source of truth for tables, fields, API routes, and permissions.
- Every feature must have acceptance criteria.
- Every completed feature must be verified by a relevant tool or test.
- No database deployment should happen before migrations and policies are reviewed.

## Recommended Stack

| Layer | Tool |
| --- | --- |
| Web framework | Next.js App Router |
| Language | TypeScript |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Authorization | RBAC plus Supabase RLS |
| Payments | SePay webhook-based payment confirmation |
| Transactional email | Resend |
| Hosting | Vercel |
| Source control and CI | GitHub Actions plus Vercel deployment checks |
| UI | Tailwind CSS plus reusable components |
| E2E testing | Playwright |
| Validation | Zod |
| Forms | React Hook Form |
| Monitoring | Vercel logs and error monitoring provider selected before production launch |

## Scope Boundary

This platform does not process a transaction between an end user and a provider. An inquiry only creates a contact request and notification. The only payment flow in the core is an application membership plan paid by bank transfer and confirmed through SePay.

## High-Level Routes

| Area | Example routes |
| --- | --- |
| Public | `/`, `/blog`, `/blog/[slug]`, `/pricing`, `/contact` |
| Auth | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` |
| User app | `/dashboard`, `/account`, `/favorites`, `/notifications`, `/billing` |
| Provider app | `/provider/dashboard`, `/provider/profile`, `/provider/inquiries`, `/provider/settings` |
| Admin app | `/admin`, `/admin/users`, `/admin/providers`, `/admin/content`, `/admin/billing`, `/admin/settings`, `/admin/audit-logs` |
