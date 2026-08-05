# Module: Media Storage

## Purpose

Handle uploaded files such as user avatars, provider logos, and CMS images.

## Completion

Current completion: 65%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Avatar uploads | verified | 70% | Authenticated desktop/mobile form uploads to Storage and updates the profile URL |
| Provider logo uploads | verified | 70% | Provider desktop/mobile form uploads to Storage and updates organization logo URL |
| CMS image uploads | verified | 65% | Editor upload auto-fills the post cover URL and the image renders on the public post |
| Storage policies | implemented | 45% | Deployed migration defines path ownership policies; direct client-policy acceptance remains |
| File validation | verified | 65% | Live browser upload of `text/plain` receives `422` and does not mutate the avatar; valid PNG flow remains accepted |

## Planned Buckets

| Bucket | Purpose | Access |
| --- | --- | --- |
| `avatars` | User avatars | Public read, owner write |
| `organization-media` | Provider logos and images | Public read, owner/admin write |
| `content-media` | CMS images | Public read, editor/admin write |

## Verified Evidence

Verified on: 2026-08-04
Task: M3 Media
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-media` (desktop and mobile)
Result: pass
Notes: Temporary user and provider accounts uploaded PNG avatar/logo files through the real UI. The suite verified the persisted public URLs, removed the Storage objects, organization and users. CMS editor upload is verified separately through the CMS suite. Direct Storage-RLS and invalid-file acceptance remain.

Verified on: 2026-08-05
Task: M3 Media
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-media`
Result: pass (2/2 desktop/mobile)
Notes: Before valid PNG upload, the suite supplied a `text/plain` file through the real file input. The server returned `422`, the profile avatar URL stayed null, then the valid avatar/logo uploads and Storage cleanup completed. Direct Storage-RLS and oversized-file acceptance remain.
