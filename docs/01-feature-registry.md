# Feature Registry

This file lists every planned, in-progress, and completed feature.

Status values:

- `planned`: designed but not implemented
- `in_progress`: implementation started
- `implemented`: code exists
- `verified`: code exists and has passed acceptance tests
- `deferred`: intentionally delayed

## Core Feature List

| ID | Module | Feature | Status | Completion | Notes |
| --- | --- | --- | --- | --- | --- |
| AUTH-001 | Auth | Register with email and password | planned | 0% | Supabase Auth |
| AUTH-002 | Auth | Login with email and password | planned | 0% | Supabase Auth |
| AUTH-003 | Auth | Logout | planned | 0% | Must clear session |
| AUTH-004 | Auth | Forgot password request | planned | 0% | Email reset flow |
| AUTH-005 | Auth | Reset password | planned | 0% | Secure token flow |
| AUTH-006 | Auth | Email verification | planned | 0% | Required before sensitive actions |
| AUTH-007 | Auth | Protected routes | planned | 0% | Middleware plus server checks |
| AUTH-008 | Auth | Session refresh and expiry handling | planned | 0% | SSR compatible |
| ACCOUNT-001 | Account | Personal profile | planned | 0% | Name, avatar, phone, location |
| ACCOUNT-002 | Account | Account preferences | planned | 0% | Language, timezone, notification settings |
| ACCOUNT-003 | Account | Security settings | planned | 0% | Password, sessions |
| ACCOUNT-004 | Account | User dashboard | planned | 0% | Role-aware |
| ROLE-001 | Roles | Role model | planned | 0% | `user`, `provider`, `editor`, `admin`, `super_admin` |
| ROLE-002 | Roles | Permission matrix | planned | 0% | Documented and enforced |
| ROLE-003 | Roles | Admin role assignment | planned | 0% | Audited |
| PROVIDER-001 | Provider | Organization profile | planned | 0% | Provider identity |
| PROVIDER-002 | Provider | Provider onboarding | planned | 0% | Draft to pending review |
| PROVIDER-003 | Provider | Provider approval workflow | planned | 0% | Admin controlled |
| PROVIDER-004 | Provider | Provider dashboard | planned | 0% | Inquiry and profile status |
| NOTIFY-001 | Notifications | Notification inbox | planned | 0% | Per-account in-app inbox |
| NOTIFY-002 | Notifications | Mark notification as read | planned | 0% | Single and bulk |
| NOTIFY-003 | Notifications | Admin broadcast notification | planned | 0% | Admin only |
| FAVORITE-001 | Favorites | Add item to favorites | planned | 0% | Generic entity model |
| FAVORITE-002 | Favorites | Remove item from favorites | planned | 0% | Ownership protected |
| FAVORITE-003 | Favorites | Favorites list page | planned | 0% | User dashboard area |
| INQUIRY-001 | Inquiries | Submit inquiry to provider | planned | 0% | No in-app transaction |
| INQUIRY-002 | Inquiries | Provider inquiry inbox | planned | 0% | Provider only |
| INQUIRY-003 | Inquiries | Admin inquiry oversight | planned | 0% | Operational visibility |
| BILLING-001 | Billing | Membership plans | planned | 0% | Admin configurable |
| BILLING-002 | Billing | Generate payment reference | planned | 0% | For SePay transfer content |
| BILLING-003 | Billing | SePay webhook endpoint | planned | 0% | Must be idempotent |
| BILLING-004 | Billing | Payment transaction log | planned | 0% | Unique SePay transaction id |
| BILLING-005 | Billing | Activate membership after payment | planned | 0% | Server-side only |
| CMS-001 | CMS | Public home page content | planned | 0% | Admin configurable |
| CMS-002 | CMS | Static pages | planned | 0% | Terms, privacy, about, contact |
| CMS-003 | CMS | Blog posts | planned | 0% | Draft and published states |
| CMS-004 | CMS | Blog categories | planned | 0% | Slug-based |
| CMS-005 | CMS | SEO metadata | planned | 0% | Page title, description, OG image |
| CMS-006 | CMS | Static page publishing | planned | 0% | About, privacy, terms and contact |
| SETTINGS-001 | Settings | App branding settings | planned | 0% | Logo, app name, colors |
| SETTINGS-002 | Settings | Header menu settings | planned | 0% | Admin configurable |
| SETTINGS-003 | Settings | Footer menu settings | planned | 0% | Admin configurable |
| SETTINGS-004 | Settings | Social links | planned | 0% | Admin configurable |
| MEDIA-001 | Media | Avatar upload | planned | 0% | Storage policies required |
| MEDIA-002 | Media | Provider logo upload | planned | 0% | Storage policies required |
| MEDIA-003 | Media | CMS image upload | planned | 0% | Editor/admin only |
| AUDIT-001 | Audit | Audit log table | planned | 0% | For sensitive actions |
| AUDIT-002 | Audit | Admin audit log viewer | planned | 0% | Admin only |
| DESIGN-001 | Design System | Base layout | planned | 0% | Public, app, admin layouts |
| DESIGN-002 | Design System | Reusable components | planned | 0% | Button, input, table, modal, toast |
| DESIGN-003 | Design System | Theme tokens | planned | 0% | Colors, spacing, typography |
| TEST-001 | Testing | Typecheck | planned | 0% | Required before completion |
| TEST-002 | Testing | Production build | planned | 0% | Required before completion |
| TEST-003 | Testing | Playwright auth tests | planned | 0% | Register/login/protected route |
| TEST-004 | Testing | Permission tests | planned | 0% | User/provider/admin access |
| EMAIL-001 | Transactional email | Send account and operational emails | planned | 0% | Resend server-side only |
| EMAIL-002 | Transactional email | Track delivery, bounce and complaint events | planned | 0% | Webhook-based audit trail |
| OPS-001 | Operations | Environment variable contract | planned | 0% | Local, preview and production |
| OPS-002 | Operations | GitHub quality gate | planned | 0% | Typecheck, build and tests |
| OPS-003 | Operations | Vercel deployment configuration | planned | 0% | Preview and production |
| OPS-004 | Operations | Production monitoring and incident runbook | planned | 0% | Solo-operator friendly |
| SECURITY-001 | Security | Rate limiting and abuse protection | planned | 0% | Auth, inquiry and webhook routes |
| SECURITY-002 | Security | Security headers and secret handling | planned | 0% | Verified before production |
