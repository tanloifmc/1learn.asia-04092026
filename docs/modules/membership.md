# Module: Membership Lifecycle

## Purpose

Provide reusable membership plans and subscription state without embedding a payment provider, bank account, webhook, or application domain.

The application never processes a transaction between users and providers.

## Completion

Current completion: `80%`

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Membership plans | verified | 80% | Administrator create/update/delete unused plans; live browser deletion and used-plan conflict pass |
| Current subscription | implemented | 65% | Authenticated user can read own active subscription; separate member browser session passes |
| Administrator activation and renewal | verified | 80% | Administrator can create or extend a subscription with an audit event; live renewal increases `ends_at` |
| Administrator suspension and reactivation | implemented | 70% | Administrator can change subscription state with an audit event; live suspension, inactive member state and reactivation pass |
| Payment adapter | planned | 0% | Added only by the consuming application and verified with its provider sandbox |

## Required Data

- `membership_plans` (`price_amount`, ISO 4217 `currency`, duration and active state)
- `membership_subscriptions`
- `audit_logs`

## Extension Boundary

A consuming application may add a payment module with its own migrations, provider secret, webhook routes, idempotency rules and acceptance tests. That module can activate a `membership_subscription` only after its server-side provider confirmation; it must never trust a browser success claim.

## Verification Evidence

On 2026-08-05, `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-membership` passed 2/2 desktop/mobile: an administrator created a plan, activated/suspended/reactivated a membership, renewed it with an increased `ends_at`, confirmed a used plan returns `409` on deletion and deleted an unused plan. Temporary data was deleted after each suite. Payment-provider sandbox remains a consuming-application concern.
