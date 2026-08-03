# API Contracts

This file defines canonical API routes.

No endpoint should be implemented before it is listed here.

## API Rules

- Use route handlers under `/app/api`.
- Validate all input with Zod.
- Never trust client-side roles.
- Every protected endpoint must fetch the authenticated user server-side.
- Every admin endpoint must check admin permissions server-side.
- Webhook endpoints must be idempotent.
- Webhook secrets must never be exposed to the browser.

## Planned API Routes

### Auth and Account

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/account/me` | User | Current account, profile, roles |
| `PATCH` | `/api/account/profile` | User | Update profile |
| `PATCH` | `/api/account/preferences` | User | Update preferences |

Supabase Auth handles register, login, logout, email verification, forgot password, and reset password. The application still needs pages and server-side route guards for those flows.

### Favorites

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/favorites` | User | List current user's favorites |
| `POST` | `/api/favorites` | User | Add favorite |
| `DELETE` | `/api/favorites/[id]` | User | Remove favorite |

### Notifications

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/notifications` | User | List notifications |
| `PATCH` | `/api/notifications/[id]/read` | User | Mark one as read |
| `PATCH` | `/api/notifications/read-all` | User | Mark all as read |

### Provider

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/provider/profile` | Provider | Read provider organization profile |
| `PATCH` | `/api/provider/profile` | Provider | Update provider profile |
| `POST` | `/api/provider/submit-for-review` | Provider | Submit provider for admin approval |
| `GET` | `/api/provider/inquiries` | Provider | Provider inquiry inbox |

### Inquiries

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/inquiries` | User | Send inquiry to provider |
| `GET` | `/api/inquiries/sent` | User | User's sent inquiries |

### Billing and SePay

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/billing/plans` | Public | List active membership plans |
| `POST` | `/api/billing/payment-intents` | User | Create SePay payment reference |
| `GET` | `/api/billing/subscription` | User | Read current subscription |
| `POST` | `/api/webhooks/sepay` | Webhook secret | Receive SePay transaction webhook |

### CMS

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/content/posts` | Public | List published posts |
| `GET` | `/api/content/posts/[slug]` | Public | Read published post |
| `GET` | `/api/content/categories` | Public | List categories |
| `GET` | `/api/content/pages/[slug]` | Public | Read published static page |

### Email Webhooks

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/webhooks/resend` | Webhook secret | Record permitted email delivery events |

### Admin

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/admin/users` | Admin | List users |
| `PATCH` | `/api/admin/users/[id]/role` | Admin | Change user role |
| `GET` | `/api/admin/providers` | Admin | List providers |
| `PATCH` | `/api/admin/providers/[id]/status` | Admin | Approve, reject, suspend provider |
| `GET` | `/api/admin/content/posts` | Editor/Admin | List all posts |
| `POST` | `/api/admin/content/posts` | Editor/Admin | Create post |
| `PATCH` | `/api/admin/content/posts/[id]` | Editor/Admin | Update post |
| `DELETE` | `/api/admin/content/posts/[id]` | Admin | Archive/delete post |
| `GET` | `/api/admin/settings` | Admin | Read app settings |
| `PATCH` | `/api/admin/settings` | Admin | Update app settings |
| `GET` | `/api/admin/audit-logs` | Admin | Read audit logs |
