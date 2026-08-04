# Source Architecture

This is the required target structure for the reusable Next.js core. It separates reusable platform capabilities from future domain modules.

```text
src/
  app/
    (public)/
    (auth)/
    (app)/
    (provider)/
    (admin)/
    api/
    layout.tsx
    global-error.tsx
  components/
    ui/
    layouts/
    features/
  features/
    auth/
    account/
    roles/
    notifications/
    favorites/
    organizations/
    inquiries/
    billing/
    cms/
    settings/
    media/
    audit/
  lib/
    supabase/
    auth/
    permissions/
    validation/
    billing/
    resend/
    utils/
  config/
  types/
  styles/
supabase/
  migrations/
  seed.sql
tests/
  e2e/
  integration/
  fixtures/
docs/
```

## Current Adoption

M1-002 is at `50%` and is deliberately being migrated feature by feature rather than creating empty folders.

| Capability | Current location | State |
| --- | --- | --- |
| Account lookup | `src/features/account/current-account.ts` | Implemented and consumed by routes/layouts |
| Public settings and branding | `src/features/settings/public-settings.ts` | Implemented and consumed by public layouts/pages |
| Other core capabilities | Existing routes and shared libraries | Remain to be migrated when their next phase changes them |

The target folders are a contract for new work. A folder is created only when it owns real code and tests.

## Ownership Rules

| Location | Responsibility |
| --- | --- |
| `src/app` | Routing, layouts, page composition and route handlers only; legacy pages migrate when changed |
| `src/features` | Each business module's UI, server actions, queries, schemas and tests |
| `src/components/ui` | Reusable domain-neutral design-system components |
| `src/lib` | Infrastructure adapters and shared primitives; it must not render page UI |
| `src/config` | Versioned non-secret defaults and navigation definitions |
| `supabase/migrations` | Only reviewed, ordered database migrations |
| `tests` | Automated acceptance evidence; do not hide tests inside unrelated modules |
| `docs` | Canonical contracts, board and operational knowledge |

## Domain Module Rule

A future travel module belongs in `src/features/travel/` and may depend on the core modules above. Core modules may never import from a domain module. This keeps the foundation reusable for another product.

## Required Integration Boundaries

- Browser code can use only public configuration and the Supabase publishable key.
- Resend adapters live under `src/lib/` and are called only by trusted server code. Payment adapters are intentionally excluded from the reusable core.
- Route handlers validate external input, call a feature service, write audit data where necessary, and return a typed result.
- New or changed page components must not access the database directly; use feature query/service boundaries. Existing routes migrate incrementally under M1-002.
