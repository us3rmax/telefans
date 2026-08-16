alter table public.telegram_users
  add column if not exists coins_balance integer not null default 0,
  add column if not exists referral_count integer not null default 0,
  add column if not exists referred_by bigint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'telegram_users_referred_by_fkey'
      and conrelid = 'public.telegram_users'::regclass
  ) then
    alter table public.telegram_users
      add constraint telegram_users_referred_by_fkey
      foreign key (referred_by)
      references public.telegram_users (telegram_id)
      on delete set null;
  end if;
end $$;

create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null references public.telegram_users (telegram_id) on delete cascade,
  amount integer not null check (amount <> 0),
  transaction_type text not null check (transaction_type in ('referral_signup')),
  referred_telegram_id bigint references public.telegram_users (telegram_id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint coin_transactions_referral_once
    unique (transaction_type, referred_telegram_id)
);

create index if not exists coin_transactions_telegram_id_created_at_idx
  on public.coin_transactions (telegram_id, created_at desc);

alter table public.coin_transactions enable row level security;

create or replace function public.claim_referral_reward(
  p_referred_telegram_id bigint,
  p_referrer_telegram_id bigint
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  referred_by_id bigint;
  reward_inserted boolean := false;
begin
  if p_referred_telegram_id is null
     or p_referrer_telegram_id is null
     or p_referred_telegram_id = p_referrer_telegram_id then
    return false;
  end if;

  if not exists (
    select 1 from public.telegram_users
    where telegram_id = p_referrer_telegram_id
  ) then
    return false;
  end if;

  select referred_by
    into referred_by_id
    from public.telegram_users
   where telegram_id = p_referred_telegram_id
   for update;

  if not found or (referred_by_id is not null and referred_by_id <> p_referrer_telegram_id) then
    return false;
  end if;

  if referred_by_id is null then
    update public.telegram_users
       set referred_by = p_referrer_telegram_id,
           updated_at = now()
     where telegram_id = p_referred_telegram_id;
  end if;

  insert into public.coin_transactions (
    telegram_id,
    amount,
    transaction_type,
    referred_telegram_id,
    metadata
  ) values (
    p_referrer_telegram_id,
    2,
    'referral_signup',
    p_referred_telegram_id,
    jsonb_build_object('source', 'telegram_start_param')
  )
  on conflict (transaction_type, referred_telegram_id) do nothing;

  reward_inserted := found;

  if reward_inserted then
    update public.telegram_users
       set coins_balance = coins_balance + 2,
           referral_count = referral_count + 1,
           updated_at = now()
     where telegram_id = p_referrer_telegram_id;
  end if;

  return reward_inserted;
end;
$$;

revoke all on function public.claim_referral_reward(bigint, bigint) from public, anon, authenticated;
grant execute on function public.claim_referral_reward(bigint, bigint) to service_role;
