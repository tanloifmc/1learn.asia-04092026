# Module: Inquiries

## Purpose

Provide a generic contact/request flow between users and provider organizations.

## Completion

Current completion: 45%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Submit inquiry | implemented | 35% | Authenticated user can send a validated message through the application form/API |
| User sent inquiries | implemented | 35% | User can view their own sent requests |
| Provider inbox | implemented | 35% | Provider has a protected inbox screen and API |
| Mark inquiry read | implemented | 45% | Provider can update the inquiry lifecycle status through a protected API/UI |
| Admin oversight | implemented | 45% | Admin can inspect provider inquiries and separate application support requests |
| Notification integration | implemented | 45% | Provider receives inquiry notifications; application administrators receive support-request notifications |
| Application support request | implemented | 35% | Authenticated user contact/history page, local RLS migration and administrator status UI pass production build |

## Payment Boundary

Inquiries must not include in-app payment or settlement between users and providers.

## Verification Evidence

On 2026-08-04, TypeScript, ESLint and the Next.js production build passed with the provider inquiry lifecycle and the separate support-request user/admin routes. Playwright confirmed that anonymous visitors see the contact login CTA and are redirected from `/admin/support` to `/login`, without browser console errors. The `support_requests` migration is local only and needs two-account RLS/browser acceptance after the release database push.
