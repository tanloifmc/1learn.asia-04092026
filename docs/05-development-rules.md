# Development Rules

These rules protect the core from becoming inconsistent or hard to reuse.

## Before Coding

1. Read `docs/README.md`.
2. Read `docs/00-system-overview.md`.
3. Read `docs/01-feature-registry.md`.
4. Read `docs/02-module-completion-tracker.md`.
5. Read the relevant module document in `docs/modules/`.
6. Update data or API contracts before implementing new tables or endpoints.

## Completion Rule

A feature is not complete unless all of these are true:

- It is implemented in code.
- It is documented in the feature registry.
- Its database contract is documented if it stores data.
- Its API contract is documented if it exposes an endpoint.
- It has appropriate auth and permission checks.
- It has a test or specialist verification result.
- The module completion tracker has been updated.

## Database Rule

Do not push schema changes to a remote Supabase project until:

- Migrations are written in the repo.
- RLS policies are reviewed.
- Seed data is reviewed.
- Local or dry-run verification passes.
- The user explicitly approves the remote push.

## Release Batch Rule

The core platform is delivered in named release batches, not as scattered cloud changes.

- Complete the agreed modules, source code, migration files and acceptance evidence in the repository first.
- Keep later migrations local until the batch is accepted as a coherent release.
- Then push code to GitHub, push the pending migration set to Supabase, configure Vercel and deploy in that order.
- A local commit is an implementation checkpoint only; it is not a cloud release.
- The initial baseline migrations were pushed to `Travel Plan` on 2026-08-03 before this rule was adopted. Treat that remote state as frozen until the first full core release batch.

## Secret Rule

Never commit secrets.

Use environment variables for:

- Supabase project URL
- Supabase publishable key
- Supabase service role key
- Supabase access token
- SePay webhook secret
- SePay API key
- Vercel tokens

If a secret is shared in chat, assume it may need to be rotated before production use.

## Reusability Rule

Core modules must not depend on travel-specific concepts.

Allowed core terms:

- user
- provider
- organization
- content
- category
- inquiry
- favorite
- notification
- membership
- payment
- setting
- audit log

Travel-specific terms such as trip, itinerary, destination, tour, hotel, and activity belong in a future domain module.

## Verification Rule

Recommended checks before marking a feature as verified:

- TypeScript check
- Production build
- Unit or integration tests
- Playwright happy path
- Playwright permission denial path
- Supabase RLS tests for data isolation
- Payment webhook idempotency test for billing features
