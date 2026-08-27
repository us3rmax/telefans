-- Per-creator subscription offers and Telegram-backed memberships.
-- Sensitive destinations stay private and are only returned after a confirmed subscription.
create table if not exists public.creator_subscription_settings (
  creator_id uuid primary key references public.creators(id) on delete cascade,
  plan_mode text not null default 'free' check (plan_mode in ('free', 'paid', 'promo')),
  title text not null default 'Subscription',
  message text not null default '',
  normal_price_stars integer not null default 0 check (normal_price_stars between 0 and 10000),
  promo_price_stars integer not null default 0 check (promo_price_stars between 0 and 10000),
  promo_days integer not null default 30 check (promo_days between 1 and 3650),
  promo_expires_at timestamptz,
  telegram_username text not null default '',
  vip_channel_url text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_subscription_settings_active_idx
  on public.creator_subscription_settings (is_active, promo_expires_at);

create table if not exists public.creator_subscriptions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  telegram_id bigint not null references public.telegram_users(telegram_id) on delete cascade,
  subscription_type text not null check (subscription_type in ('free', 'paid', 'promo')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'active', 'expired', 'cancelled')),
  stars_amount integer not null default 0 check (stars_amount >= 0),
  telegram_invoice_payload text unique,
  telegram_payment_charge_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_id, telegram_id)
);

create index if not exists creator_subscriptions_telegram_status_idx
  on public.creator_subscriptions (telegram_id, payment_status, current_period_end desc);
create index if not exists creator_subscriptions_creator_status_idx
  on public.creator_subscriptions (creator_id, payment_status, current_period_end desc);

alter table public.creator_subscription_settings enable row level security;
alter table public.creator_subscriptions enable row level security;

drop policy if exists creator_subscription_settings_admin_all on public.creator_subscription_settings;
create policy creator_subscription_settings_admin_all
  on public.creator_subscription_settings for all to public
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists creator_subscriptions_admin_all on public.creator_subscriptions;
create policy creator_subscriptions_admin_all
  on public.creator_subscriptions for all to public
  using (public.is_admin()) with check (public.is_admin());

comment on table public.creator_subscription_settings is
  'Per-creator public offer settings plus private Telegram/VIP destinations.';
comment on table public.creator_subscriptions is
  'One current subscription state per Telegram user and creator, confirmed by Telegram Stars or free activation.';
