# Module: Provider Organizations

## Purpose

Represent external businesses, partners, creators, sellers, or service providers.

## Completion

Current completion: 80%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Provider onboarding | verified | 65% | Live desktop/mobile browser test creates the provider profile and cleans up the temporary organization |
| Organization profile editing | verified | 65% | Provider creates then updates name, description, phone and website through the real form; persisted data is verified before review submission |
| Submit for review | verified | 65% | Live desktop/mobile browser test changes the temporary profile from draft to pending review |
| Admin approval | verified | 70% | Live desktop/mobile browser test approves a pending provider and verifies the owner notification |
| Public provider page | implemented | 45% | Source directory/detail render only approved organizations; public RLS policy fix `20260805051757` awaits final Supabase release |
| Provider dashboard | verified | 70% | Live provider inbox lifecycle passes; a second Provider receives no other organization inquiries and cannot update them |

## Required Data

- `organizations`
- `user_roles`
- `audit_logs`

## Verification Evidence

On 2026-08-04, `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-provider` passed on desktop and mobile. It created a temporary confirmed user, logged in, created an organization, verified automatic provider-role assignment, submitted it for review and verified the dashboard role before deleting the organization and user.

Verified on: 2026-08-05
Task: M3-002
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-inquiries`
Result: pass (2/2 desktop/mobile)
Notes: The inquiry owner updated its record. A second temporary Provider received an empty provider inbox and its direct update attempt for the first organization's inquiry returned `404`. All temporary data was deleted.

Pending release on: 2026-08-05
Task: M3-002
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-admin-provider`
Result: source fix required
Notes: Before approval the public provider API correctly returned `404`, and the Admin approval plus provider notification still passed. A separate anonymous browser did not see the newly approved provider because the deployed organization policy mixes the approved condition with `private.is_admin()`, which is unavailable to `anon`. Source migration `20260805051757_fix_public_organization_read_policy.sql` separates approved public reads from authenticated owner reads; rerun the same suite after the final Supabase release.

Verified on: 2026-08-05
Task: M3-002
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-provider`
Result: pass (2/2 desktop/mobile)
Notes: A temporary Provider created a draft organization, updated its name, description, phone and website through the real form, and the trusted test client verified the stored fields before the Provider submitted the profile for review. Temporary records were deleted.
