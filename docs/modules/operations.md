# Operations Module

## Purpose

Provide reliable delivery and support practices for a solo-operated production application.

## Release Policy

`CORE-1` is assembled and verified locally before any further cloud operation. The remote Supabase baseline is frozen; the GitHub branch remains unpushed; and Vercel remains undeployed until the full release batch is accepted.

## Completion

Current completion: `25%`

## Current Blockers

- On 2026-08-03, Windows initially denied creation of `.git/HEAD.lock`; this was resolved with approved local Git access and the foundation is committed on `codex/core-foundation`.
- Supabase management access can list project `Travel Plan`. The local CLI is v2.33.7 while v2.111.0 is available, and its OAuth login was interrupted before browser authentication completed. Upgrade, complete login, then link with the remote database password.
- Git remote is configured as `https://github.com/lenguyen02042004-lang/Core-platform.git`, but push is denied because the current local Git credential belongs to `1weddingasia`.
- Vercel CLI did not confirm an authenticated account.
- Dependency installation reported 11 npm audit findings (including 6 high) after Resend was added. Their production reachability must be classified and resolved before a production release.

## Verified Infrastructure Evidence

Verified on: 2026-08-03
Task: M2-001
Checks: remote migration list, `supabase db advisors --linked --type security`, direct RLS catalog query, direct function-privilege query
Result: pass
Notes: Initial schema and advisor remediation migrations are deployed to project `Travel Plan`; all 16 core tables have RLS enabled and security advisors report no issues.

## Planned Capabilities

- GitHub repository, branch protection and quality checks
- Vercel Preview and Production environments
- Versioned environment contract without committed secrets
- Production deployment, rollback and incident runbook
- Error monitoring, operational alerts and health verification
- Database backup and recovery process

## Implemented Security Baseline

- Security headers are configured at the Next.js edge: frame denial, MIME sniffing prevention, strict referrer policy, permissions policy and HSTS.
- Payment-intent, inquiry and SePay webhook routes have an in-memory rate limiter.
- The in-memory limiter is process-local. It protects a single instance only and must be replaced by a shared store before a multi-instance production release.

## Implemented Delivery Baseline

- `GET /api/health` returns a secret-free liveness response and reports whether browser-safe Supabase configuration is present.
- GitHub Actions quality gate installs from the lockfile, then runs typecheck, lint and production build on pull requests and pushes to the release branches.

## Transactional Email Integration

- Resend sending is server-only and is skipped safely until `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured.
- Idempotent confirmation emails are wired to support-request receipt and successful SePay membership activation.
- Resend delivery webhook records supported lifecycle events in `email_events`.
- Domain verification and sandbox delivery evidence are still required before production release.

## Acceptance Criteria

- Pull request quality gate runs typecheck, lint, build and relevant tests.
- Preview deployment cannot access Production secrets or payment webhooks.
- Production deployment, rollback and incident instructions are documented and tested.
- Monitoring captures application errors without exposing personal data or secrets.
