# Module: Notifications

## Purpose

Provide an in-app notification inbox for every account.

## Completion

Current completion: 35%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Notification inbox | implemented | 25% | User can list their own notifications |
| Unread count | planned | 0% | Header/dashboard shows unread count |
| Mark as read | implemented | 25% | User can mark one notification as read |
| Mark all as read | implemented | 25% | User can clear unread state |
| Admin broadcast | planned | 0% | Admin can send system notification |
| Event-created notifications | planned | 0% | Billing, inquiry, provider approval can create notifications |

## Required Data

- `notifications`

## Privacy Rule

Users can only read notifications where `recipient_user_id` is their own user id.

## Verified Evidence

Verified on: 2026-08-03
Task: M3-001
Checks: direct TypeScript check, direct ESLint check, Next.js production build
Result: partial pass
Notes: Per-account RLS is deployed. On 2026-08-04, the gated live check inserted a temporary recipient notification and confirmed a second account could not read it; inbox mutation, events and browser acceptance remain.
