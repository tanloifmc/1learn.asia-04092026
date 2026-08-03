# Operations Module

## Purpose

Provide reliable delivery and support practices for a solo-operated production application.

## Completion

Current completion: `0%`

## Current Blockers

- On 2026-08-03, Windows initially denied creation of `.git/HEAD.lock`; this was resolved with approved local Git access and the foundation is committed on `codex/core-foundation`.
- Supabase management access can list project `Travel Plan`. The local CLI is v2.33.7 while v2.111.0 is available, and its OAuth login was interrupted before browser authentication completed. Upgrade, complete login, then link with the remote database password.
- Git remote is configured as `https://github.com/lenguyen02042004-lang/Core-platform.git`, but push is denied because the current local Git credential belongs to `1weddingasia`.
- Vercel CLI did not confirm an authenticated account.
- Dependency installation reported 5 npm audit findings (including 3 high). Their production reachability must be classified and resolved before a production release.

## Planned Capabilities

- GitHub repository, branch protection and quality checks
- Vercel Preview and Production environments
- Versioned environment contract without committed secrets
- Production deployment, rollback and incident runbook
- Error monitoring, operational alerts and health verification
- Database backup and recovery process

## Acceptance Criteria

- Pull request quality gate runs typecheck, lint, build and relevant tests.
- Preview deployment cannot access Production secrets or payment webhooks.
- Production deployment, rollback and incident instructions are documented and tested.
- Monitoring captures application errors without exposing personal data or secrets.
