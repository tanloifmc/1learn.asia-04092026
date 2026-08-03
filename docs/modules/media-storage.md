# Module: Media Storage

## Purpose

Handle uploaded files such as user avatars, provider logos, and CMS images.

## Completion

Current completion: 0%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Avatar uploads | planned | 0% | User can upload and replace own avatar |
| Provider logo uploads | planned | 0% | Provider can upload logo for own organization |
| CMS image uploads | planned | 0% | Editor/admin can upload images for content |
| Storage policies | planned | 0% | Users cannot overwrite files they do not own |
| File validation | planned | 0% | File size and type are restricted |

## Planned Buckets

| Bucket | Purpose | Access |
| --- | --- | --- |
| `avatars` | User avatars | Public read, owner write |
| `organization-media` | Provider logos and images | Public read, owner/admin write |
| `content-media` | CMS images | Public read, editor/admin write |

