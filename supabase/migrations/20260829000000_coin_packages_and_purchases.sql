create table if not exists public.coin_packages (
  code text primary key,
  name text not null,
  coins integer not null check (coins > 0),
  price_stars integer not null check (price_stars > 0),
  price_usd numeric(10,2) not null check (price_usd >= 0),
  badge text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.coin_packages (code, name, coins, price_stars, price_usd, badge, featured, sort_order)
values
  ('starter', 'Starter', 200, 50, 0.99, null, false, 10),
  ('fan', 'Fan', 500, 125, 2.49, null, false, 20),
  ('supporter', 'Supporter', 1000, 250, 4.99, null, false, 30),
  ('superfan', 'Superfan', 2000, 500, 9.99, 'MOST POPULAR', true, 5),
  ('insider', 'Insider', 3000, 750, 14.99, null, false, 40),
  ('vip', 'VIP', 4000, 1000, 19.99, null, false, 50),
  ('elite', 'Elite', 10000, 2500, 49.99, 'BEST SELLER', false, 60),
  ('legend', 'Legend', 15000, 3750, 74.99, null, false, 70),
  ('icon', 'Icon', 20000, 5000, 99.99, null, false, 80),
  ('mythic', 'Mythic', 40000, 10000, 199.99, null, false, 90)
on conflict (code) do update set
  name = excluded.name,
  coins = excluded.coins,
  price_stars = excluded.price_stars,
  price_usd = excluded.price_usd,
  badge = excluded.badge,
  featured = excluded.featured,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

create table if not exists public.coin_purchases (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null references public.telegram_users (telegram_id) on delete cascade,
  package_code text not null references public.coin_packages (code),
  coins integer not null check (coins > 0),
  stars_amount integer not null check (stars_amount > 0),
  currency text not null default 'XTR' check (currency = 'XTR'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  invoice_payload text not null unique,
  telegram_payment_charge_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists coin_purchases_telegram_created_idx
  on public.coin_purchases (telegram_id, created_at desc);
create index if not exists coin_purchases_status_created_idx
  on public.coin_purchases (status, created_at desc);

alter table public.coin_packages enable row level security;
alter table public.coin_purchases enable row level security;

-- Package reads and purchase writes are performed by the server-side Edge Function.
-- No public policy is added for coin purchases.

alter table public.coin_transactions drop constraint if exists coin_transactions_transaction_type_check;
alter table public.coin_transactions
  add constraint coin_transactions_transaction_type_check
  check (transaction_type in ('referral_signup', 'coin_purchase', 'coin_refund'));

create or replace function public.settle_coin_purchase(
  p_invoice_payload text,
  p_telegram_payment_charge_id text,
  p_telegram_id bigint,
  p_total_amount integer
)
returns table(ok boolean, coins_balance integer, already_processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  purchase_row public.coin_purchases%rowtype;
  current_balance integer;
begin
  if nullif(trim(p_invoice_payload), '') is null
     or nullif(trim(p_telegram_payment_charge_id), '') is null
     or p_telegram_id is null
     or p_total_amount is null
     or p_total_amount <= 0 then
    raise exception 'Invalid coin payment payload';
  end if;

  select *
    into purchase_row
    from public.coin_purchases
   where invoice_payload = p_invoice_payload
   for update;

  if not found then
    raise exception 'Unknown coin invoice payload';
  end if;

  if purchase_row.telegram_id <> p_telegram_id then
    raise exception 'Coin invoice payer does not match purchase user';
  end if;

  if purchase_row.stars_amount <> p_total_amount then
    raise exception 'Coin invoice amount does not match package';
  end if;

  select coins_balance
    into current_balance
    from public.telegram_users
   where telegram_id = p_telegram_id
   for update;

  if not found then
    raise exception 'Coin purchase user does not exist';
  end if;

  if purchase_row.status = 'paid' then
    if purchase_row.telegram_payment_charge_id = p_telegram_payment_charge_id then
      return query select true, current_balance, true;
      return;
    end if;
    raise exception 'Coin purchase was already paid with another charge';
  end if;

  update public.coin_purchases
     set status = 'paid',
         telegram_payment_charge_id = p_telegram_payment_charge_id,
         paid_at = coalesce(paid_at, now())
   where id = purchase_row.id;

  insert into public.coin_transactions (
    telegram_id,
    amount,
    transaction_type,
    metadata
  ) values (
    p_telegram_id,
    purchase_row.coins,
    'coin_purchase',
    jsonb_build_object(
      'purchase_id', purchase_row.id,
      'package_code', purchase_row.package_code,
      'stars_amount', purchase_row.stars_amount,
      'telegram_payment_charge_id', p_telegram_payment_charge_id
    )
  );

  update public.telegram_users
     set coins_balance = coins_balance + purchase_row.coins,
         updated_at = now()
   where telegram_id = p_telegram_id
   returning coins_balance into current_balance;

  return query select true, current_balance, false;
end;
$$;

revoke all on function public.settle_coin_purchase(text, text, bigint, integer) from public, anon, authenticated;
grant execute on function public.settle_coin_purchase(text, text, bigint, integer) to service_role;
