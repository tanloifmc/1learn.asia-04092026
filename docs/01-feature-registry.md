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
| AUTH-002 | Auth | Login with email and password | verified | 60% | Live browser login reaches the dashboard on desktop and mobile with a temporary confirmed user |
| AUTH-003 | Auth | Logout | verified | 60% | Live browser logout returns to login and protected dashboard access is denied after session removal |
| AUTH-004 | Auth | Forgot password request | implemented | 35% | Password recovery form source |
| AUTH-005 | Auth | Reset password | implemented | 35% | Reset-password form source |
| AUTH-006 | Auth | Email verification | implemented | 25% | Auth callback processes verification redirects; live email acceptance remains |
| AUTH-007 | Auth | Protected routes | verified | 65% | Anonymous and post-logout browser access to `/dashboard` redirects to login; multi-role routes remain |
| AUTH-008 | Auth | Session refresh and expiry handling | implemented | 35% | Supabase SSR proxy session refresh source |
| ACCOUNT-001 | Account | Personal profile | implemented | 45% | Profile API/UI, avatar upload and local build evidence |
| ACCOUNT-002 | Account | Account preferences | implemented | 35% | Local RLS migration plus notification preference UI/API |
| ACCOUNT-003 | Account | Security settings | implemented | 35% | Authenticated password change API and account UI |
| ACCOUNT-004 | Account | User dashboard | verified | 55% | Live browser login renders protected dashboard and default user role on desktop and mobile |
| ROLE-001 | Roles | Role model | implemented | 60% | Default user role and temporary administrator role both pass live Supabase acceptance |
| ROLE-002 | Roles | Permission matrix | implemented | 60% | Live RLS check proves standard-user isolation and administrator profile visibility; provider/editor cases remain |
| ROLE-003 | Roles | Admin role assignment | implemented | 35% | Server-guarded role API, audit logging and admin screen; live tests remain |
| PROVIDER-001 | Provider | Organization profile | implemented | 35% | API plus authenticated create/update profile UI |
| PROVIDER-002 | Provider | Provider onboarding | implemented | 35% | Draft-to-review API and provider screen |
| PROVIDER-003 | Provider | Provider approval workflow | implemented | 45% | Admin moderation API/UI, provider notification and public approved visibility |
| PROVIDER-004 | Provider | Provider dashboard | implemented | 50% | Profile/review state and inquiry inbox/status lifecycle |
| NOTIFY-001 | Notifications | Notification inbox | verified | 70% | Recipient-only RLS passes live; desktop/mobile browser journey receives and displays two administrator broadcasts |
| NOTIFY-002 | Notifications | Mark notification as read | verified | 70% | Single and bulk mutations pass live desktop/mobile; unread-count integration remains |
| NOTIFY-003 | Notifications | Admin broadcast notification | verified | 65% | Repeated admin-selected recipient broadcasts pass live desktop/mobile; large-audience delivery and audit inspection remain |
| FAVORITE-001 | Favorites | Add item to favorites | verified | 80% | Generic provider/blog model; owner-only RLS, live save interaction and duplicate `409` contract pass |
| FAVORITE-002 | Favorites | Remove item from favorites | verified | 75% | Ownership-protected API reports `404` for missing/non-visible records; live desktop/mobile remove interaction passes |
| FAVORITE-003 | Favorites | Favorites list page | verified | 75% | User dashboard list/entity lookup and owner-only RLS; live desktop/mobile list interaction passes |
| INQUIRY-001 | Inquiries | Submit inquiry to provider | implemented | 35% | Authenticated form and API; no in-app transaction |
| INQUIRY-002 | Inquiries | Provider inquiry inbox | implemented | 50% | Provider screen, status lifecycle API and sender notification |
| INQUIRY-003 | Inquiries | Admin inquiry oversight | implemented | 35% | Admin oversight API and viewer screen |
| BILLING-001 | Membership | Membership plans | implemented | 65% | Administrator create/update and public active-plan API with currency-neutral amount model; live desktop/mobile membership journey passes |
| SUPPORT-001 | Support | Submit application support request | verified | 60% | Authenticated contact form creates a live request on desktop/mobile; validation-boundary coverage remains |
| SUPPORT-002 | Support | User support request history | verified | 55% | Sender sees the live request and its administrator-updated status in contact history |
| SUPPORT-003 | Support | Administrator support request handling | verified | 60% | Administrator list and status update pass live desktop/mobile; audit-log inspection remains |
| BILLING-002 | Membership | Administrator activation and renewal | implemented | 70% | Protected administrator flow creates, extends, suspends and reactivates subscriptions with audit logs; live desktop/mobile activation, suspension, reactivation and member-read journey passes |
| BILLING-003 | Membership | Payment-provider extension point | planned | 0% | Each consuming application selects and implements its own compliant provider module |
| CMS-001 | CMS | Public home page content | implemented | 35% | Validated public setting, server-rendered home and admin form |
| CMS-002 | CMS | Static pages | implemented | 70% | Editor create/publish and public rendering pass live desktop/mobile acceptance |
| CMS-003 | CMS | Blog posts | verified | 82% | Editor uploads a cover image, publishes it with the post and public blog rendering passes live desktop/mobile |
| CMS-004 | CMS | Blog categories | implemented | 50% | Public CRUD API and editor create/edit UI |
| CMS-005 | CMS | SEO metadata | implemented | 60% | Post/page author controls and public route metadata |
| CMS-006 | CMS | Static page publishing | implemented | 40% | CMS-published pages render publicly; privacy and terms have code fallbacks until an editor publishes their final content |
| SETTINGS-001 | Settings | App branding settings | implemented | 55% | Typed admin form, server validation, audit log and validated runtime branding consumption pass production build |
| SETTINGS-002 | Settings | Header menu settings | implemented | 55% | Typed admin form, server validation, audit log and validated runtime header consumption pass production build |
| SETTINGS-003 | Settings | Footer menu settings | implemented | 55% | Typed admin form, server validation, audit log and validated runtime footer consumption pass production build |
| SETTINGS-004 | Settings | Social links | implemented | 50% | Typed admin form, URL validation, audit log and shared footer rendering pass production build |
| MEDIA-001 | Media | Avatar upload | verified | 70% | Authenticated desktop/mobile UI upload creates a real Storage object and persists the profile URL |
| MEDIA-002 | Media | Provider logo upload | verified | 70% | Provider desktop/mobile UI upload creates a real Storage object and persists the organization URL |
| MEDIA-003 | Media | CMS image upload | verified | 65% | Editor desktop/mobile UI upload auto-fills the post cover URL and public post rendering passes live |
| AUDIT-001 | Audit | Audit log table | implemented | 50% | Server-only writer records role, provider, notification, settings, CMS, membership-plan and subscription actions; live verification remains |
| AUDIT-002 | Audit | Admin audit log viewer | implemented | 40% | Admin-only API and viewer screen pass production build; live access/filtering acceptance remains |
| DESIGN-001 | Design System | Base layout | implemented | 25% | Public header/footer and account application layout |
| DESIGN-002 | Design System | Reusable components | verified | 50% | Accessible button, form field, status message and empty state are implemented and used by login/support flows; GitHub CI passes; table, modal and toast remain |
| DESIGN-003 | Design System | Theme tokens | implemented | 25% | CSS color, spacing, typography and responsive layout tokens |
| ARCH-001 | App scaffold | Feature-module boundaries | implemented | 50% | `account` and `settings` queries are owned by `src/features`; remaining capabilities will migrate incrementally |
| TEST-001 | Testing | Typecheck | verified | 100% | Local and remote GitHub Quality Gate checks pass |
| TEST-002 | Testing | Production build | verified | 100% | Local and remote GitHub Quality Gate builds pass |
| TEST-003 | Testing | Playwright public and access tests | verified | 75% | GitHub Quality Gate `30885182320` passes six desktop/mobile tests for public shell, anonymous protected routes and labelled login controls; real auth remains |
| TEST-004 | Testing | Permission tests | in_progress | 25% | Anonymous protected-route denial is automated; user/provider/admin and RLS cases remain |
| EMAIL-001 | Transactional email | Send account and operational emails | implemented | 35% | Server-only idempotent Resend helper is wired to support-request receipt; application modules may add membership events |
| EMAIL-002 | Transactional email | Track delivery, bounce and complaint events | implemented | 25% | Raw-body verified Resend webhook stores permitted events idempotently |
| OPS-001 | Operations | Environment variable contract | verified | 100% | Local and GitHub CI validation checks required names, blank template secrets, ignore rules and forbidden integration variables |
| OPS-002 | Operations | GitHub quality gate | implemented | 75% | Remote type/lint/build and Chromium Playwright baseline pass on the release branch |
| OPS-003 | Operations | Vercel deployment configuration | planned | 0% | Preview and production |
| OPS-004 | Operations | Production monitoring and incident runbook | planned | 0% | Solo-operator friendly |
| SECURITY-001 | Security | Rate limiting and abuse protection | implemented | 25% | Process-local limiter protects inquiry and support-request routes |
| SECURITY-002 | Security | Security headers and secret handling | implemented | 25% | Next headers configured; secrets remain server-only environment values |
