# Module: Media Storage

## Purpose

Handle uploaded files such as user avatars, provider logos, and CMS images.

## Completion

Current completion: 35%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Avatar uploads | implemented | 35% | Authenticated form and validated server upload update the profile URL |
| Provider logo uploads | implemented | 35% | Provider form and validated server upload update organization logo URL |
| CMS image uploads | implemented | 25% | Editor/admin server upload authorization exists; author UI remains |
| Storage policies | implemented | 25% | Local migration defines path ownership policies for all buckets |
| File validation | implemented | 25% | Local migration limits buckets to JPEG, PNG, WebP and 5 MB |

## Planned Buckets

| Bucket | Purpose | Access |
| --- | --- | --- |
| `avatars` | User avatars | Public read, owner write |
| `organization-media` | Provider logos and images | Public read, owner/admin write |
| `content-media` | CMS images | Public read, editor/admin write |
