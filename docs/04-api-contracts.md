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

### Operations

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Liveness/configuration-safe health check without secrets |

### Auth and Account

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/account/me` | User | Current account, profile, roles |
| `PATCH` | `/api/account/profile` | User | Update profile |
| `PATCH` | `/api/account/preferences` | User | Update preferences |
| `GET` | `/api/account/preferences` | User | Read preferences |
| `PATCH` | `/api/account/password` | User | Change current account password |

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
| `GET` | `/api/providers` | Public | List approved provider organizations |
| `GET` | `/api/providers/[slug]` | Public | Read approved provider organization |
| `GET` | `/api/provider/organization` | User/Provider | Read current user's provider organization |
| `POST` | `/api/provider/organization` | User | Create provider organization draft |
| `PATCH` | `/api/provider/organization` | Provider | Update provider organization profile |
| `POST` | `/api/provider/submit-for-review` | Provider | Submit provider for admin approval |
| `GET` | `/api/provider/inquiries` | Provider | Provider inquiry inbox |
| `PATCH` | `/api/provider/inquiries/[id]` | Provider | Update own inquiry status |

### Inquiries

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/inquiries` | User | Send inquiry to provider |
| `GET` | `/api/inquiries/sent` | User | User's sent inquiries |

### Support Requests

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/support-requests` | User | List current user's support requests |
| `POST` | `/api/support-requests` | User | Submit a validated support request and notify administrators |

### Media

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/media/upload` | User/Provider/Editor | Upload validated avatar, provider logo or CMS image |

### Billing and SePay

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/billing/plans` | Public | List active membership plans |
| `POST` | `/api/billing/payment-intents` | User | Create SePay payment reference |
| `GET` | `/api/billing/subscription` | User | Read current subscription |
| `POST` | `/api/webhooks/sepay` | Webhook secret | Receive SePay transaction webhook |
| `POST` | `/hooks/sepay-payment` | Webhook secret | Public SePay endpoint alias for `https://www.clientpulse.asia/hooks/sepay-payment` |

### CMS

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/content/posts` | Public | List published posts |
| `GET` | `/api/content/posts/[slug]` | Public | Read published post |
| `GET` | `/api/content/categories` | Public | List categories |
| `GET` | `/api/content/pages/[slug]` | Public | Read published static page |
| `GET` | `/api/content/settings` | Public | Read public application settings |

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
| `GET` | `/api/admin/content/categories` | Editor/Admin | List categories |
| `POST` | `/api/admin/content/categories` | Editor/Admin | Create category |
| `PATCH` | `/api/admin/content/categories/[id]` | Editor/Admin | Update category |
| `GET` | `/api/admin/content/pages` | Editor/Admin | List static pages |
| `POST` | `/api/admin/content/pages` | Editor/Admin | Create static page |
| `PATCH` | `/api/admin/content/pages/[id]` | Editor/Admin | Update static page |
| `GET` | `/api/admin/settings` | Admin | Read app settings |
| `PATCH` | `/api/admin/settings` | Admin | Update app settings |
| `GET` | `/api/admin/audit-logs` | Admin | Read audit logs |
| `GET` | `/api/admin/inquiries` | Admin | Inspect all inquiries |
| `GET` | `/api/admin/support-requests` | Admin | Inspect application support requests |
| `PATCH` | `/api/admin/support-requests/[id]` | Admin | Update support-request status and handler |
| `POST` | `/api/admin/notifications/broadcast` | Admin | Send a validated notification to selected accounts |
| `GET` | `/api/admin/billing/plans` | Admin | List membership plans |
| `POST` | `/api/admin/billing/plans` | Admin | Create membership plan |
| `PATCH` | `/api/admin/billing/plans/[id]` | Admin | Update membership plan |
| `GET` | `/api/admin/billing/payment-intents` | Admin | Inspect membership payment intents |
