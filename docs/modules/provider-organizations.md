# Module: Provider Organizations

## Purpose

Represent external businesses, partners, creators, sellers, or service providers.

## Completion

Current completion: 55%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Provider onboarding | implemented | 35% | Authenticated user can create a provider organization from the provider screen |
| Organization profile editing | implemented | 35% | Provider can update business information through validated API and form |
| Submit for review | implemented | 35% | Provider can submit draft for review from the provider screen |
| Admin approval | implemented | 45% | Admin can approve, reject or suspend with provider notification |
| Public provider page | implemented | 45% | Public directory/detail render only approved organizations |
| Provider dashboard | implemented | 50% | Provider manages organization state and inquiry lifecycle |

## Required Data

- `organizations`
- `user_roles`
- `audit_logs`

## Verification Evidence

On 2026-08-03, TypeScript, ESLint and the Next.js production build passed with `/provider` and `/provider/inquiries` screens and their API routes.
