# Data Contracts

This file defines canonical database names and relationships.

No table, column, enum, or relationship should be added in code before this file is updated.

## Naming Rules

- Use snake_case for database tables and columns.
- Use plural table names.
- Use `id uuid primary key` unless there is a strong reason not to.
- Use `created_at timestamptz not null default now()`.
- Use `updated_at timestamptz not null default now()` for mutable tables.
- Use `created_by uuid references auth.users(id)` for admin-created records where relevant.
- Use RLS on every table in exposed schemas.
- Do not authorize using user-editable metadata.

## Planned Enums

| Enum | Values | Purpose |
| --- | --- | --- |
| `app_role` | `user`, `provider`, `editor`, `admin`, `super_admin` | Account authorization |
| `organization_status` | `draft`, `pending_review`, `approved`, `rejected`, `suspended` | Provider lifecycle |
| `content_status` | `draft`, `published`, `archived` | CMS lifecycle |
| `notification_type` | `system`, `account`, `billing`, `inquiry`, `content` | Notification classification |
| `payment_status` | `pending`, `confirmed`, `failed`, `expired`, `refunded` | Payment lifecycle |
| `inquiry_status` | `new`, `read`, `responded`, `closed`, `spam` | Inquiry lifecycle |
| `email_event_type` | `sent`, `delivered`, `bounced`, `complained`, `failed` | Transactional email lifecycle |

## Planned Tables

### `profiles`

Extends `auth.users`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, references `auth.users(id)` |
| `display_name` | `text` | User-facing name |
| `avatar_url` | `text` | Optional |
| `phone` | `text` | Optional |
| `locale` | `text` | Default `vi` |
| `timezone` | `text` | Default `Asia/Ho_Chi_Minh` |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |

### `user_roles`

Stores application authorization roles.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | References `auth.users(id)` |
| `role` | `app_role` | Required |
| `created_at` | `timestamptz` | Required |
| `created_by` | `uuid` | Optional admin who assigned role |

### `organizations`

Generic provider/business account.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `owner_id` | `uuid` | References `auth.users(id)` |
| `name` | `text` | Required |
| `slug` | `text` | Unique |
| `logo_url` | `text` | Optional |
| `description` | `text` | Optional |
| `contact_email` | `text` | Optional |
| `contact_phone` | `text` | Optional |
| `website_url` | `text` | Optional |
| `status` | `organization_status` | Required |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |

### `notifications`

In-app notification inbox for every account.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `recipient_user_id` | `uuid` | References `auth.users(id)` |
| `type` | `notification_type` | Required |
| `title` | `text` | Required |
| `body` | `text` | Optional |
| `action_url` | `text` | Optional |
| `read_at` | `timestamptz` | Null means unread |
| `created_at` | `timestamptz` | Required |

### `favorites`

Generic favorites model. This supports users saving providers, posts, places, services, or future domain entities.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | References `auth.users(id)` |
| `entity_type` | `text` | Example: `organization`, `post`, future domain module types |
| `entity_id` | `uuid` | ID of favorited entity |
| `created_at` | `timestamptz` | Required |

Unique rule: `user_id`, `entity_type`, `entity_id`.

### `inquiries`

Generic contact request from a user to a provider organization.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `sender_user_id` | `uuid` | References `auth.users(id)` |
| `organization_id` | `uuid` | References `organizations(id)` |
| `subject` | `text` | Required |
| `message` | `text` | Required |
| `status` | `inquiry_status` | Required |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |

### `membership_plans`

Admin-configurable membership plans.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `code` | `text` | Unique stable identifier |
| `name` | `text` | Required |
| `description` | `text` | Optional |
| `price_vnd` | `integer` | Required |
| `duration_days` | `integer` | Required |
| `is_active` | `boolean` | Required |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |

### `membership_subscriptions`

Tracks active or historical user/provider memberships.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | References `auth.users(id)` |
| `organization_id` | `uuid` | Optional, for provider plans |
| `plan_id` | `uuid` | References `membership_plans(id)` |
| `starts_at` | `timestamptz` | Required |
| `ends_at` | `timestamptz` | Required |
| `is_active` | `boolean` | Required |
| `created_at` | `timestamptz` | Required |

### `payment_intents`

Internal payment requests before bank transfer confirmation.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | References `auth.users(id)` |
| `plan_id` | `uuid` | References `membership_plans(id)` |
| `amount_vnd` | `integer` | Required |
| `payment_reference` | `text` | Unique transfer content code |
| `status` | `payment_status` | Required |
| `expires_at` | `timestamptz` | Required |
| `confirmed_at` | `timestamptz` | Optional |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |

### `sepay_transactions`

Raw transaction records from SePay webhooks.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `sepay_transaction_id` | `text` | Unique |
| `gateway` | `text` | Bank gateway |
| `transaction_date` | `timestamptz` | From SePay |
| `account_number` | `text` | From SePay |
| `transfer_type` | `text` | Expected `in` for incoming payment |
| `transfer_amount` | `integer` | VND amount |
| `reference_code` | `text` | From SePay |
| `content` | `text` | Transfer content |
| `raw_payload` | `jsonb` | Full webhook body |
| `matched_payment_intent_id` | `uuid` | Optional |
| `created_at` | `timestamptz` | Required |

### `content_categories`

CMS categories.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `name` | `text` | Required |
| `slug` | `text` | Unique |
| `description` | `text` | Optional |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |

### `content_posts`

CMS blog posts or articles.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `category_id` | `uuid` | Optional |
| `author_id` | `uuid` | References `auth.users(id)` |
| `title` | `text` | Required |
| `slug` | `text` | Unique |
| `excerpt` | `text` | Optional |
| `body` | `text` | Required |
| `cover_image_url` | `text` | Optional |
| `status` | `content_status` | Required |
| `seo_title` | `text` | Optional |
| `seo_description` | `text` | Optional |
| `published_at` | `timestamptz` | Optional |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |

### `content_pages`

CMS-managed static pages such as about, privacy, terms and contact.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `author_id` | `uuid` | References `auth.users(id)` |
| `title` | `text` | Required |
| `slug` | `text` | Unique stable URL segment |
| `body` | `text` | Required |
| `status` | `content_status` | Required |
| `seo_title` | `text` | Optional |
| `seo_description` | `text` | Optional |
| `published_at` | `timestamptz` | Optional |
| `created_at` | `timestamptz` | Required |
| `updated_at` | `timestamptz` | Required |

### `app_settings`

Key-value settings for branding, menus, SEO, and app behavior.

| Column | Type | Notes |
| --- | --- | --- |
| `key` | `text` | Primary key |
| `value` | `jsonb` | Required |
| `is_public` | `boolean` | Controls unauthenticated read access |
| `updated_at` | `timestamptz` | Required |
| `updated_by` | `uuid` | Optional admin/editor |

### `audit_logs`

Operational audit trail.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `actor_user_id` | `uuid` | Optional |
| `action` | `text` | Required |
| `entity_type` | `text` | Required |
| `entity_id` | `uuid` | Optional |
| `metadata` | `jsonb` | Optional |
| `created_at` | `timestamptz` | Required |

### `email_events`

Optional operational history for transactional-email provider callbacks.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `provider_event_id` | `text` | Unique provider event reference |
| `type` | `email_event_type` | Required |
| `recipient_email` | `text` | Required; operationally protected |
| `payload` | `jsonb` | Raw callback data, retained by policy |
| `created_at` | `timestamptz` | Required |
