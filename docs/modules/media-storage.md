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
| Storage policies | implemented | 45% | Avatar owner policy passes a direct authenticated upload; organization owner policy fix `20260805045743` awaits final Supabase release and full direct acceptance rerun |
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

Pending release on: 2026-08-05
Task: M3 Media
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-media`
Result: source fix required
Notes: The expanded suite proved a normal user can upload directly to their own avatar prefix, but a Provider owner received `new row violates row-level security policy` when uploading directly to their own organization-media prefix. The UI upload still passes because its server route uses the service role, so that path cannot prove client RLS. Source migration `20260805045743_fix_organization_media_owner_policy.sql` separates owner checks from administrator checks. Release it with the final Supabase batch, then rerun the same suite to prove owner allow and cross-account upload/delete denial.
