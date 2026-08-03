# Module: Billing and SePay

## Purpose

Support membership payments for the application itself.

The application must not process transactions between users and providers.

## Completion

Current completion: 0%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Membership plans | planned | 0% | Admin can configure active plans |
| Payment intent | planned | 0% | User can generate payment reference and amount |
| Payment instructions | planned | 0% | User sees bank transfer details and reference code |
| SePay webhook | planned | 0% | Server receives transaction events |
| Webhook authentication | planned | 0% | HMAC-SHA256 or API key verification |
| Idempotency | planned | 0% | Duplicate SePay transactions do not double-activate plans |
| Match payment | planned | 0% | Transaction content maps to payment intent |
| Activate membership | planned | 0% | Confirmed payment creates or extends subscription |
| Admin transaction viewer | planned | 0% | Admin can inspect payments and webhook payloads |

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

