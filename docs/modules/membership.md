# Module: Membership Lifecycle

## Purpose

Provide reusable membership plans and subscription state without embedding a payment provider, bank account, webhook, or application domain.

The application never processes a transaction between users and providers.

## Completion

Current completion: `70%`

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Membership plans | implemented | 65% | Administrator create/update and public active-plan API with currency-neutral amount fields; live browser plan creation passes |
| Current subscription | implemented | 65% | Authenticated user can read own active subscription; separate member browser session passes |
| Administrator activation and renewal | implemented | 70% | Administrator can create or extend a subscription with an audit event; live activation passes |
| Administrator suspension and reactivation | implemented | 70% | Administrator can change subscription state with an audit event; live suspension, inactive member state and reactivation pass |
| Payment adapter | planned | 0% | Added only by the consuming application and verified with its provider sandbox |

## Required Data

- `membership_plans` (`price_amount`, ISO 4217 `currency`, duration and active state)
- `membership_subscriptions`
- `audit_logs`

## Extension Boundary

A consuming application may add a payment module with its own migrations, provider secret, webhook routes, idempotency rules and acceptance tests. That module can activate a `membership_subscription` only after its server-side provider confirmation; it must never trust a browser success claim.

## Verification Evidence

On 2026-08-04, TypeScript, ESLint, Next.js production build and `npm audit` passed after the generic refactor. Migration `20260804110000_generalize_membership_billing.sql` is deployed to Supabase and the security advisor reports no issues. `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-membership` passed 2/2 desktop/mobile: an administrator created a plan, selected a user, activated membership, suspended it, verified the member lost the active panel, then reactivated it and verified the panel returned. Temporary data was deleted after each suite. Renewal extension, plan deletion and any consuming application's payment-provider sandbox remain required before the percentage can increase.
