-- Reusable application core: identities, permissions, shared modules and operations.
-- All public tables have RLS enabled. Server-only workflows use a trusted route
-- handler or webhook and must never expose a service-role key to the browser.

create schema if not exists private;

create type public.app_role as enum ('user', 'provider', 'editor', 'admin', 'super_admin');
create type public.organization_status as enum ('draft', 'pending_review', 'approved', 'rejected', 'suspended');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.notification_type as enum ('system', 'account', 'billing', 'inquiry', 'content');
create type public.payment_status as enum ('pending', 'confirmed', 'failed', 'expired', 'refunded');
create type public.inquiry_status as enum ('new', 'read', 'responded', 'closed', 'spam');
create type public.email_event_type as enum ('sent', 'delivered', 'bounced', 'complained', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  phone text,
  locale text not null default 'vi',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (user_id, role)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  contact_email text,
  contact_phone text,
  website_url text,
  status public.organization_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  subject text not null,
  message text not null,
  status public.inquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price_vnd integer not null check (price_vnd > 0),
  duration_days integer not null check (duration_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.membership_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete restrict,
  plan_id uuid not null references public.membership_plans(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.membership_plans(id) on delete restrict,
  amount_vnd integer not null check (amount_vnd > 0),
  payment_reference text not null unique,
  status public.payment_status not null default 'pending',
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sepay_transactions (
  id uuid primary key default gen_random_uuid(),
  sepay_transaction_id text not null unique,
  gateway text,
  transaction_date timestamptz,
  account_number text,
  transfer_type text not null,
  transfer_amount integer not null check (transfer_amount > 0),
  reference_code text,
  content text,
  raw_payload jsonb not null,
  matched_payment_intent_id uuid references public.payment_intents(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.content_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.content_categories(id) on delete set null,
  author_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null,
  cover_image_url text,
  status public.content_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  slug text not null unique,
  body text not null,
  status public.content_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  type public.email_event_type not null,
  recipient_email text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index notifications_recipient_created_at_idx on public.notifications (recipient_user_id, created_at desc);
create index inquiries_sender_created_at_idx on public.inquiries (sender_user_id, created_at desc);
create index inquiries_organization_created_at_idx on public.inquiries (organization_id, created_at desc);
create index payment_intents_user_created_at_idx on public.payment_intents (user_id, created_at desc);
create index membership_subscriptions_user_ends_at_idx on public.membership_subscriptions (user_id, ends_at desc);
create index content_posts_status_published_at_idx on public.content_posts (status, published_at desc);
create index content_pages_status_published_at_idx on public.content_pages (status, published_at desc);
create index audit_logs_entity_created_at_idx on public.audit_logs (entity_type, entity_id, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role in ('admin', 'super_admin')
  );
$$;

create or replace function private.is_content_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role in ('editor', 'admin', 'super_admin')
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.is_admin() from public;
revoke all on function private.is_content_manager() from public;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_content_manager() to authenticated;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function private.set_updated_at();
create trigger inquiries_set_updated_at before update on public.inquiries
for each row execute function private.set_updated_at();
create trigger membership_plans_set_updated_at before update on public.membership_plans
for each row execute function private.set_updated_at();
create trigger payment_intents_set_updated_at before update on public.payment_intents
for each row execute function private.set_updated_at();
create trigger content_categories_set_updated_at before update on public.content_categories
for each row execute function private.set_updated_at();
create trigger content_posts_set_updated_at before update on public.content_posts
for each row execute function private.set_updated_at();
create trigger content_pages_set_updated_at before update on public.content_pages
for each row execute function private.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.organizations enable row level security;
alter table public.notifications enable row level security;
alter table public.favorites enable row level security;
alter table public.inquiries enable row level security;
alter table public.membership_plans enable row level security;
alter table public.membership_subscriptions enable row level security;
alter table public.payment_intents enable row level security;
alter table public.sepay_transactions enable row level security;
alter table public.content_categories enable row level security;
alter table public.content_posts enable row level security;
alter table public.content_pages enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.email_events enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles for select to authenticated
using ((select auth.uid()) = id or private.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles for update to authenticated
using ((select auth.uid()) = id or private.is_admin())
with check ((select auth.uid()) = id or private.is_admin());

create policy "user_roles_select_own_or_admin" on public.user_roles for select to authenticated
using ((select auth.uid()) = user_id or private.is_admin());

create policy "organizations_public_or_owner_read" on public.organizations for select to anon, authenticated
using (status = 'approved' or (select auth.uid()) = owner_id or private.is_admin());
create policy "organizations_owner_create_draft" on public.organizations for insert to authenticated
with check ((select auth.uid()) = owner_id and status = 'draft');
create policy "organizations_admin_manage" on public.organizations for all to authenticated
using (private.is_admin()) with check (private.is_admin());

create policy "notifications_owner_read" on public.notifications for select to authenticated
using ((select auth.uid()) = recipient_user_id);
create policy "notifications_owner_mark_read" on public.notifications for update to authenticated
using ((select auth.uid()) = recipient_user_id)
with check ((select auth.uid()) = recipient_user_id);

create policy "favorites_owner_manage" on public.favorites for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "inquiries_sender_or_admin_read" on public.inquiries for select to authenticated
using ((select auth.uid()) = sender_user_id or private.is_admin());
create policy "inquiries_sender_create" on public.inquiries for insert to authenticated
with check ((select auth.uid()) = sender_user_id and status = 'new');
create policy "inquiries_admin_manage" on public.inquiries for all to authenticated
using (private.is_admin()) with check (private.is_admin());

create policy "membership_plans_public_read_active" on public.membership_plans for select to anon, authenticated
using (is_active or private.is_admin());
create policy "membership_plans_admin_manage" on public.membership_plans for all to authenticated
using (private.is_admin()) with check (private.is_admin());

create policy "subscriptions_owner_or_admin_read" on public.membership_subscriptions for select to authenticated
using ((select auth.uid()) = user_id or private.is_admin());
create policy "subscriptions_admin_manage" on public.membership_subscriptions for all to authenticated
using (private.is_admin()) with check (private.is_admin());

create policy "payment_intents_owner_read" on public.payment_intents for select to authenticated
using ((select auth.uid()) = user_id);
create policy "payment_intents_owner_create" on public.payment_intents for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'pending');
create policy "payment_intents_admin_read" on public.payment_intents for select to authenticated
using (private.is_admin());
create policy "sepay_transactions_admin_read" on public.sepay_transactions for select to authenticated
using (private.is_admin());

create policy "content_categories_public_read" on public.content_categories for select to anon, authenticated
using (true);
create policy "content_categories_manager_manage" on public.content_categories for all to authenticated
using (private.is_content_manager()) with check (private.is_content_manager());
create policy "content_posts_public_read_published" on public.content_posts for select to anon, authenticated
using (status = 'published' or private.is_content_manager());
create policy "content_posts_manager_manage" on public.content_posts for all to authenticated
using (private.is_content_manager()) with check (private.is_content_manager());
create policy "content_pages_public_read_published" on public.content_pages for select to anon, authenticated
using (status = 'published' or private.is_content_manager());
create policy "content_pages_manager_manage" on public.content_pages for all to authenticated
using (private.is_content_manager()) with check (private.is_content_manager());

create policy "app_settings_public_read" on public.app_settings for select to anon, authenticated
using (is_public or private.is_admin());
create policy "app_settings_admin_manage" on public.app_settings for all to authenticated
using (private.is_admin()) with check (private.is_admin());
create policy "audit_logs_admin_read" on public.audit_logs for select to authenticated
using (private.is_admin());
create policy "email_events_admin_read" on public.email_events for select to authenticated
using (private.is_admin());
