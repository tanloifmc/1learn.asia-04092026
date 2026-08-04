create table public.account_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_notifications boolean not null default true,
  product_updates boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger account_preferences_set_updated_at before update on public.account_preferences
for each row execute function private.set_updated_at();

alter table public.account_preferences enable row level security;
grant select, insert, update on public.account_preferences to authenticated;
create policy "account_preferences_owner_select" on public.account_preferences for select to authenticated
using ((select auth.uid()) = user_id);
create policy "account_preferences_owner_insert" on public.account_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "account_preferences_owner_update" on public.account_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
