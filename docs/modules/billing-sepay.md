# Module: Billing and SePay

## Purpose

Support membership payments for the application itself.

The application must not process transactions between users and providers.

## Completion

Current completion: 40%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Membership plans | implemented | 40% | Active plans API, member selection and current-subscription display pass production build |
| Payment intent | implemented | 35% | Authenticated user creates a server-side reference, amount and expiry from trusted plan data; creation is audited |
| Payment instructions | implemented | 40% | Member screen displays configured bank/account/reference plus exact amount and expiry |
| SePay webhook | implemented | 25% | `POST /api/webhooks/sepay` accepts documented transaction payload |
| Webhook authentication | implemented | 25% | HMAC-SHA256 check over raw request body and `X-SePay-Signature` |
| Idempotency | implemented | 25% | Unique SePay transaction ID returns successful duplicate response |
| Match payment | implemented | 25% | Incoming transfer, exact reference, pending intent, expiry and amount are checked |
| Activate membership | implemented | 35% | Server-only confirmation creates or extends membership, notifies user and records a system audit event |
| Admin transaction viewer | implemented | 35% | Protected payment-intent viewer exists in admin billing; sandbox payload inspection remains |

## Required Data

- `membership_plans`
- `membership_subscriptions`
- `payment_intents`
- `sepay_transactions`
- `audit_logs`
- `notifications`

## Payment Boundary

Allowed:

- User pays the application for membership.
- Provider may pay the application for membership if enabled later.

Not allowed:

- User pays provider through the app.
- Provider receives settlement through the app.
- The app holds funds for marketplace transactions.

## Verification Evidence

On 2026-08-04, TypeScript, ESLint and the Next.js production build passed with billing routes, membership current-status UI, exact transfer instructions/expiry and payment audit events. The external SePay webhook alias is `https://www.clientpulse.asia/hooks/sepay-payment`, which invokes the same signed/idempotent handler as `/api/webhooks/sepay` after the application is deployed to that domain. Sandbox and live webhook verification remain required before payment functionality can be accepted as live.
