-- A student's account deletion must not be blocked by their own Premium records.
alter table public.membership_subscriptions
  drop constraint if exists membership_subscriptions_user_id_fkey;

alter table public.membership_subscriptions
  add constraint membership_subscriptions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
