# Module: Membership Lifecycle

## Purpose

Provide reusable membership plans and subscription state without embedding a payment provider, bank account, webhook, or application domain.

The application never processes a transaction between users and providers.

## Completion

Current completion: `45%`

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Membership plans | implemented | 45% | Administrator CRUD, public active-plan API and currency-neutral amount fields pass checks |
| Current subscription | implemented | 40% | Authenticated user can read own active subscription |
| Administrator activation and renewal | implemented | 45% | Administrator can create or extend a subscription with an audit event |
| Administrator suspension and reactivation | implemented | 45% | Administrator can change subscription state with an audit event |
| Payment adapter | planned | 0% | Added only by the consuming application and verified with its provider sandbox |

## Required Data

- `membership_plans` (`price_amount`, ISO 4217 `currency`, duration and active state)
- `membership_subscriptions`
- `audit_logs`

## Extension Boundary

A consuming application may add a payment module with its own migrations, provider secret, webhook routes, idempotency rules and acceptance tests. That module can activate a `membership_subscription` only after its server-side provider confirmation; it must never trust a browser success claim.

## Verification Evidence

On 2026-08-04, TypeScript, ESLint, Next.js production build and `npm audit` passed after the generic refactor. Migration `20260804110000_generalize_membership_billing.sql` is deployed to Supabase and the security advisor reports no issues. Live authenticated administrator/member browser acceptance remains required before this percentage can increase.
