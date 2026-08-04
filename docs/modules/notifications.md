# Module: Notifications

## Purpose

Provide an in-app notification inbox for every account.

## Completion

Current completion: 65%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Notification inbox | verified | 70% | User receives and sees repeated administrator broadcasts in the real browser UI |
| Unread count | planned | 0% | Header/dashboard shows unread count |
| Mark as read | verified | 70% | User marks one notification as read in the real browser UI; missing/non-visible IDs return `404` |
| Mark all as read | verified | 65% | User clears all remaining unread notifications in the real browser UI |
| Admin broadcast | verified | 65% | Administrator sends repeated selected-user system notifications in the real browser UI |
| Event-created notifications | implemented | 45% | Provider approval, inquiry and support-request flows create notifications; broader event coverage remains |

## Required Data

- `notifications`

## Privacy Rule

Users can only read notifications where `recipient_user_id` is their own user id.

## Verified Evidence

Verified on: 2026-08-04
Task: M3-001
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-shared-core` (desktop and mobile)
Result: pass
Notes: A temporary administrator sent two notifications to a temporary user, who marked one then marked all remaining notifications read. Earlier RLS evidence proves recipient isolation. Unread count and large-audience delivery remain.
