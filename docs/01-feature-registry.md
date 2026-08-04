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
| AUTH-001 | Auth | Register with email and password | implemented | 35% | Supabase Auth register form and callback source |
| AUTH-002 | Auth | Login with email and password | implemented | 35% | Supabase Auth login form and SSR session source |
| AUTH-003 | Auth | Logout | implemented | 35% | Client sign-out control and redirect |
| AUTH-004 | Auth | Forgot password request | implemented | 35% | Password recovery form source |
| AUTH-005 | Auth | Reset password | implemented | 35% | Reset-password form source |
| AUTH-006 | Auth | Email verification | implemented | 25% | Auth callback processes verification redirects; live email acceptance remains |
| AUTH-007 | Auth | Protected routes | implemented | 50% | SSR proxy and server route guards verified by local redirect check |
| AUTH-008 | Auth | Session refresh and expiry handling | implemented | 35% | Supabase SSR proxy session refresh source |
| ACCOUNT-001 | Account | Personal profile | implemented | 45% | Profile API/UI, avatar upload and local build evidence |
| ACCOUNT-002 | Account | Account preferences | implemented | 35% | Local RLS migration plus notification preference UI/API |
| ACCOUNT-003 | Account | Security settings | implemented | 35% | Authenticated password change API and account UI |
| ACCOUNT-004 | Account | User dashboard | implemented | 35% | Protected account dashboard and role display |
| ROLE-001 | Roles | Role model | implemented | 50% | Database enum/role table and server checks |
| ROLE-002 | Roles | Permission matrix | implemented | 50% | RLS and route guard model documented and source-built |
| ROLE-003 | Roles | Admin role assignment | implemented | 35% | Server-guarded role API, audit logging and admin screen; live tests remain |
| PROVIDER-001 | Provider | Organization profile | implemented | 35% | API plus authenticated create/update profile UI |
| PROVIDER-002 | Provider | Provider onboarding | implemented | 35% | Draft-to-review API and provider screen |
| PROVIDER-003 | Provider | Provider approval workflow | implemented | 45% | Admin moderation API/UI, provider notification and public approved visibility |
| PROVIDER-004 | Provider | Provider dashboard | implemented | 50% | Profile/review state and inquiry inbox/status lifecycle |
| NOTIFY-001 | Notifications | Notification inbox | implemented | 25% | Per-account in-app inbox |
| NOTIFY-002 | Notifications | Mark notification as read | implemented | 25% | Single and bulk |
| NOTIFY-003 | Notifications | Admin broadcast notification | implemented | 35% | Admin-selected recipient broadcast, validation, rate-safe batch limit and audit log |
| FAVORITE-001 | Favorites | Add item to favorites | implemented | 40% | Generic entity model integrated on provider/blog detail |
| FAVORITE-002 | Favorites | Remove item from favorites | implemented | 40% | Ownership-protected API integrated on provider/blog detail |
| FAVORITE-003 | Favorites | Favorites list page | implemented | 40% | User dashboard area and entity lookup flow |
| INQUIRY-001 | Inquiries | Submit inquiry to provider | implemented | 35% | Authenticated form and API; no in-app transaction |
| INQUIRY-002 | Inquiries | Provider inquiry inbox | implemented | 50% | Provider screen, status lifecycle API and sender notification |
| INQUIRY-003 | Inquiries | Admin inquiry oversight | implemented | 35% | Admin oversight API and viewer screen |
| BILLING-001 | Membership | Membership plans | implemented | 45% | Admin CRUD, public active-plan API and currency-neutral amount model |
| SUPPORT-001 | Support | Submit application support request | implemented | 35% | Authenticated contact form, validation, rate limit and administrator notification pass production build |
| SUPPORT-002 | Support | User support request history | implemented | 35% | Owner-only RLS contract and contact-page history UI pass production build |
| SUPPORT-003 | Support | Administrator support request handling | implemented | 35% | Admin list/status API, UI and audit logging pass production build |
| BILLING-002 | Membership | Administrator activation and renewal | implemented | 45% | Protected admin flow creates, extends, suspends and reactivates subscriptions with audit logs |
| BILLING-003 | Membership | Payment-provider extension point | planned | 0% | Each consuming application selects and implements its own compliant provider module |
| CMS-001 | CMS | Public home page content | implemented | 35% | Validated public setting, server-rendered home and admin form |
| CMS-002 | CMS | Static pages | implemented | 50% | Public rendering plus editor create/edit/publish UI and API |
| CMS-003 | CMS | Blog posts | implemented | 60% | Full editor create/edit/publish UI, category/media control and public list/detail |
| CMS-004 | CMS | Blog categories | implemented | 50% | Public CRUD API and editor create/edit UI |
| CMS-005 | CMS | SEO metadata | implemented | 60% | Post/page author controls and public route metadata |
| CMS-006 | CMS | Static page publishing | implemented | 40% | CMS-published pages render publicly; privacy and terms have code fallbacks until an editor publishes their final content |
| SETTINGS-001 | Settings | App branding settings | implemented | 55% | Typed admin form, server validation, audit log and validated runtime branding consumption pass production build |
| SETTINGS-002 | Settings | Header menu settings | implemented | 55% | Typed admin form, server validation, audit log and validated runtime header consumption pass production build |
| SETTINGS-003 | Settings | Footer menu settings | implemented | 55% | Typed admin form, server validation, audit log and validated runtime footer consumption pass production build |
| SETTINGS-004 | Settings | Social links | implemented | 50% | Typed admin form, URL validation, audit log and shared footer rendering pass production build |
| MEDIA-001 | Media | Avatar upload | implemented | 35% | Validated server upload and profile update UI/API |
| MEDIA-002 | Media | Provider logo upload | implemented | 35% | Validated server upload and organization update UI/API |
| MEDIA-003 | Media | CMS image upload | implemented | 25% | Role-guarded server upload route; author UI remains |
| AUDIT-001 | Audit | Audit log table | implemented | 50% | Server-only writer records role, provider, notification, settings, CMS, membership-plan and subscription actions; live verification remains |
| AUDIT-002 | Audit | Admin audit log viewer | implemented | 40% | Admin-only API and viewer screen pass production build; live access/filtering acceptance remains |
| DESIGN-001 | Design System | Base layout | implemented | 25% | Public header/footer and account application layout |
| DESIGN-002 | Design System | Reusable components | in_progress | 25% | Navigation, sidebar and base button styles exist; form, table, modal and toast remain |
| DESIGN-003 | Design System | Theme tokens | implemented | 25% | CSS color, spacing, typography and responsive layout tokens |
| TEST-001 | Testing | Typecheck | verified | 100% | Local and remote GitHub Quality Gate checks pass |
| TEST-002 | Testing | Production build | verified | 100% | Local and remote GitHub Quality Gate builds pass |
| TEST-003 | Testing | Playwright public and access tests | implemented | 70% | Committed desktop/mobile public-shell and anonymous protected-route suite passes locally and in GitHub CI; real auth remains |
| TEST-004 | Testing | Permission tests | in_progress | 25% | Anonymous protected-route denial is automated; user/provider/admin and RLS cases remain |
| EMAIL-001 | Transactional email | Send account and operational emails | implemented | 35% | Server-only idempotent Resend helper is wired to support-request receipt; application modules may add membership events |
| EMAIL-002 | Transactional email | Track delivery, bounce and complaint events | implemented | 25% | Raw-body verified Resend webhook stores permitted events idempotently |
| OPS-001 | Operations | Environment variable contract | implemented | 60% | Committed validation checks required names, blank template secrets, ignore rules and forbidden integration variables; remote CI remains |
| OPS-002 | Operations | GitHub quality gate | implemented | 75% | Remote type/lint/build and Chromium Playwright baseline pass on the release branch |
| OPS-003 | Operations | Vercel deployment configuration | planned | 0% | Preview and production |
| OPS-004 | Operations | Production monitoring and incident runbook | planned | 0% | Solo-operator friendly |
| SECURITY-001 | Security | Rate limiting and abuse protection | implemented | 25% | Process-local limiter protects inquiry and support-request routes |
| SECURITY-002 | Security | Security headers and secret handling | implemented | 25% | Next headers configured; secrets remain server-only environment values |
