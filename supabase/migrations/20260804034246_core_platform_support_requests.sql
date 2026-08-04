create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 2 and 200),
  message text not null check (char_length(message) between 2 and 5000),
  status public.inquiry_status not null default 'new',
  handled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_requests_sender_created_at_idx on public.support_requests (sender_user_id, created_at desc);
create index support_requests_status_created_at_idx on public.support_requests (status, created_at desc);

create trigger support_requests_set_updated_at
before update on public.support_requests
for each row execute function private.set_updated_at();

alter table public.support_requests enable row level security;

create policy "support_requests_sender_read" on public.support_requests for select to authenticated
using ((select auth.uid()) = sender_user_id or private.is_admin());

create policy "support_requests_sender_create" on public.support_requests for insert to authenticated
with check ((select auth.uid()) = sender_user_id and status = 'new' and handled_by is null);

create policy "support_requests_admin_manage" on public.support_requests for all to authenticated
using (private.is_admin()) with check (private.is_admin());

grant select, insert on public.support_requests to authenticated;
grant update, delete on public.support_requests to authenticated;
