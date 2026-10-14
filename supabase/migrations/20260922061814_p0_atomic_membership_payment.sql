-- P0: premium payment must be idempotent and transactional.
-- The checkout RPC is callable only by its authenticated owner. Webhook settlement
-- is callable only by service_role after route-level signature verification.

alter table public.payment_transactions
  add column if not exists provider_transaction_id text,
  add column if not exists provider_payload jsonb,
  add column if not exists confirmed_at timestamptz;

create unique index if not exists payment_transactions_transaction_code_unique
  on public.payment_transactions (transaction_code)
  where transaction_code is not null;

create unique index if not exists payment_transactions_provider_transaction_id_unique
  on public.payment_transactions (provider_transaction_id)
  where provider_transaction_id is not null;

drop policy if exists "Users can insert their own payment transactions" on public.payment_transactions;

create or replace function public.create_pending_membership_payment(p_plan_code text)
returns table (transaction_code text, amount numeric, currency text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan public.membership_plans%rowtype;
  v_existing public.payment_transactions%rowtype;
  v_code text;
  v_attempt integer := 0;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if p_plan_code is null or length(trim(p_plan_code)) = 0 then
    raise exception 'plan_code_required' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':' || upper(trim(p_plan_code))));

  select *
    into v_plan
    from public.membership_plans
   where code = upper(trim(p_plan_code))
     and is_active = true;

  if not found then
    raise exception 'active_plan_not_found' using errcode = 'P0002';
  end if;

  select *
    into v_existing
    from public.payment_transactions
   where user_id = v_user_id
     and plan_id = v_plan.id
     and status = 'pending'
   order by created_at desc
   limit 1
   for update;

  if found then
    return query select v_existing.transaction_code, v_existing.amount, v_plan.currency;
    return;
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := '1L-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));
    begin
      insert into public.payment_transactions (
        user_id, amount, status, method, plan_id, transaction_code
      ) values (
        v_user_id, v_plan.price_amount, 'pending', 'bank_transfer', v_plan.id, v_code
      );
      return query select v_code, v_plan.price_amount::numeric, v_plan.currency;
      return;
    exception
      when unique_violation then
        if v_attempt >= 3 then
          raise;
        end if;
    end;
  end loop;
end;
$$;

revoke all on function public.create_pending_membership_payment(text) from public;
grant execute on function public.create_pending_membership_payment(text) to authenticated;

create or replace function public.process_sepay_membership_payment(
  p_provider_transaction_id text,
  p_transaction_code text,
  p_transfer_amount numeric,
  p_account_number text,
  p_content text,
  p_provider_payload jsonb,
  p_received_at timestamptz default now()
)
returns table (outcome text, subscription_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_transaction public.payment_transactions%rowtype;
  v_plan public.membership_plans%rowtype;
  v_subscription public.membership_subscriptions%rowtype;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  if p_provider_transaction_id is null or length(trim(p_provider_transaction_id)) = 0 then
    raise exception 'provider_transaction_id_required' using errcode = '22023';
  end if;
  if p_transaction_code is null or p_transaction_code !~ '^1L-[A-Z0-9]{6,32}$' then
    raise exception 'invalid_transaction_code' using errcode = '22023';
  end if;
  if p_transfer_amount is null or p_transfer_amount <= 0 then
    raise exception 'invalid_transfer_amount' using errcode = '22023';
  end if;
  if p_provider_payload is null then
    raise exception 'provider_payload_required' using errcode = '22023';
  end if;

  select *
    into v_transaction
    from public.payment_transactions
   where provider_transaction_id = trim(p_provider_transaction_id)
   limit 1
   for update;

  if found then
    if v_transaction.status = 'completed' then
      return query select 'already_processed'::text, (
        select id from public.membership_subscriptions
         where user_id = v_transaction.user_id
         order by ends_at desc
         limit 1
      );
      return;
    end if;
    raise exception 'provider_transaction_conflict' using errcode = '23505';
  end if;

  select *
    into v_transaction
    from public.payment_transactions
   where transaction_code = upper(trim(p_transaction_code))
   limit 1
   for update;

  if not found then
    return query select 'unmatched'::text, null::uuid;
    return;
  end if;

  if v_transaction.status = 'completed' then
    return query select 'already_processed'::text, (
      select id from public.membership_subscriptions
       where user_id = v_transaction.user_id
       order by ends_at desc
       limit 1
    );
    return;
  end if;

  if p_transfer_amount < v_transaction.amount then
    return query select 'insufficient_amount'::text, null::uuid;
    return;
  end if;

  select *
    into v_plan
    from public.membership_plans
   where id = v_transaction.plan_id
     and is_active = true
   for share;

  if not found or v_plan.duration_days <= 0 then
    raise exception 'active_plan_not_found' using errcode = 'P0002';
  end if;

  select *
    into v_subscription
    from public.membership_subscriptions
   where user_id = v_transaction.user_id
     and is_active = true
     and ends_at > p_received_at
   order by ends_at desc
   limit 1
   for update;

  if found then
    v_starts_at := v_subscription.starts_at;
    v_ends_at := v_subscription.ends_at + make_interval(days => v_plan.duration_days);
    update public.membership_subscriptions
       set ends_at = v_ends_at
     where id = v_subscription.id
     returning * into v_subscription;
  else
    v_starts_at := p_received_at;
    v_ends_at := p_received_at + make_interval(days => v_plan.duration_days);
    insert into public.membership_subscriptions (
      user_id, plan_id, starts_at, ends_at, is_active
    ) values (
      v_transaction.user_id, v_transaction.plan_id, v_starts_at, v_ends_at, true
    ) returning * into v_subscription;
  end if;

  update public.payment_transactions
     set status = 'completed',
         provider_transaction_id = trim(p_provider_transaction_id),
         provider_payload = jsonb_build_object(
           'account_number', p_account_number,
           'content', p_content,
           'payload', p_provider_payload
         ),
         confirmed_at = p_received_at
   where id = v_transaction.id;

  return query select 'processed'::text, v_subscription.id;
end;
$$;

revoke all on function public.process_sepay_membership_payment(text, text, numeric, text, text, jsonb, timestamptz) from public;
grant execute on function public.process_sepay_membership_payment(text, text, numeric, text, text, jsonb, timestamptz) to service_role;
