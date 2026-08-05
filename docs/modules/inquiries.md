# Module: Inquiries

## Purpose

Provide a generic contact/request flow between users and provider organizations.

## Completion

Current completion: 65%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Submit inquiry | verified | 65% | Live desktop/mobile browser test sends a real inquiry through the authenticated form |
| User sent inquiries | implemented | 35% | User can view their own sent requests |
| Provider inbox | verified | 65% | Live desktop/mobile browser test shows the sender inquiry only in its provider inbox |
| Mark inquiry read | verified | 65% | Live desktop/mobile browser test changes the inquiry status to `read` through the protected UI/API |
| Admin oversight | implemented | 45% | Admin can inspect provider inquiries and separate application support requests |
| Notification integration | implemented | 45% | Provider receives inquiry notifications; application administrators receive support-request notifications |
| Application support request | verified | 65% | Live desktop/mobile user/admin lifecycle passes; a second user receives no support requests through the same protected API |

## Payment Boundary

Inquiries must not include in-app payment or settlement between users and providers.

## Verification Evidence

On 2026-08-04, `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-inquiries` passed on desktop and mobile. It created temporary sender/provider users and an approved provider organization, submitted an inquiry through the browser, verified the provider inbox and changed the lifecycle to `read`, then removed all temporary data.

Verified on: 2026-08-05
Task: M3-001, Support
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-shared-core`
Result: pass (2/2 desktop/mobile)
Notes: A temporary user submitted a support request, an administrator updated it, and a separate temporary user received an empty support-request list through the same authenticated API. The users, support request and related records were deleted.
