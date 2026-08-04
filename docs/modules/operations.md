# Operations Module

## Purpose

Provide reliable delivery and support practices for a solo-operated production application.

## Release Policy

`CORE-1` source is assembled locally, then released through Supabase migration, GitHub branch push and Vercel preview before production promotion. Secrets remain environment-only and production promotion requires explicit acceptance.

## Completion

Current completion: `50%`

## Current Blockers

- Production Supabase Auth redirect URLs, administrator seeding and multi-account RLS acceptance remain.
- A project-specific production domain and production Vercel configuration remain.
- Resend sandbox credentials are still needed for live integration acceptance.

## Verified Infrastructure Evidence

Verified on: 2026-08-04
Task: CORE-1 release gate
Checks: remote migration list, `supabase db advisors --linked --type security`, GitHub branch push, Vercel Next.js preview build, TypeScript, ESLint, production build and `npm audit`
Result: pass
Notes: All six migrations are deployed to project `Travel Plan` and security advisors report no issues. Commits through `6bcd8f4` are pushed to `codex/core-foundation`, and the remote `Quality Gate` passed for the membership refactor. The current Vercel `core-platform` preview deployment built all 66 routes successfully. `npm audit` reports zero vulnerabilities after dependency upgrades.

## Planned Capabilities

- GitHub repository, branch protection and quality checks
- Vercel Preview and Production environments
- Versioned environment contract without committed secrets
- Production deployment, rollback and incident runbook
- Error monitoring, operational alerts and health verification
- Database backup and recovery process

## Implemented Security Baseline

- Security headers are configured at the Next.js edge: frame denial, MIME sniffing prevention, strict referrer policy, permissions policy and HSTS.
- Inquiry and support-request routes have an in-memory rate limiter.
- The in-memory limiter is process-local. It protects a single instance only and must be replaced by a shared store before a multi-instance production release.

## Implemented Delivery Baseline

- `GET /api/health` returns a secret-free liveness response and reports whether browser-safe Supabase configuration is present.
- GitHub Actions quality gate installs from the lockfile, then runs typecheck, lint and production build on pull requests and pushes to the release branches.

## Transactional Email Integration

- Resend sending is server-only and is skipped safely until `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured.
- Idempotent confirmation emails are wired to support-request receipt. Consuming applications can add membership events through their chosen payment adapter.
- Resend delivery webhook records supported lifecycle events in `email_events`.
- Domain verification and sandbox delivery evidence are still required before production release.

## Acceptance Criteria

- Pull request quality gate runs typecheck, lint, build and relevant tests.
- Preview deployment cannot access Production secrets or payment webhooks.
- Production deployment, rollback and incident instructions are documented and tested.
- Monitoring captures application errors without exposing personal data or secrets.
