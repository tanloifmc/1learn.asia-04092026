-- CORE-1: remove application-specific payment infrastructure and keep reusable membership state.
begin;

drop table if exists public.sepay_transactions;
drop table if exists public.payment_intents;
drop type if exists public.payment_status;

alter table public.membership_plans rename column price_vnd to price_amount;
alter table public.membership_plans add column currency text not null default 'VND' check (currency ~ '^[A-Z]{3}$');

commit;
