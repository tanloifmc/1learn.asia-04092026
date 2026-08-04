# Module: Provider Organizations

## Purpose

Represent external businesses, partners, creators, sellers, or service providers.

## Completion

Current completion: 65%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Provider onboarding | verified | 65% | Live desktop/mobile browser test creates the provider profile and cleans up the temporary organization |
| Organization profile editing | implemented | 35% | Provider can update business information through validated API and form |
| Submit for review | verified | 65% | Live desktop/mobile browser test changes the temporary profile from draft to pending review |
| Admin approval | implemented | 45% | Admin can approve, reject or suspend with provider notification |
| Public provider page | implemented | 45% | Public directory/detail render only approved organizations |
| Provider dashboard | verified | 60% | Live browser dashboard renders the provider role after onboarding; inquiry lifecycle remains |

## Required Data

- `organizations`
- `user_roles`
- `audit_logs`

## Verification Evidence

On 2026-08-04, `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-provider` passed on desktop and mobile. It created a temporary confirmed user, logged in, created an organization, verified automatic provider-role assignment, submitted it for review and verified the dashboard role before deleting the organization and user. Provider inquiry and administrator moderation journeys remain.
