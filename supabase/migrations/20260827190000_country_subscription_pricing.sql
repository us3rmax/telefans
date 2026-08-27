-- Store the creator's display prices in USD while Telegram Stars remain the checkout currency.
alter table public.creator_subscription_settings
  add column if not exists normal_price_usd numeric(6,2),
  add column if not exists promo_price_usd numeric(6,2);

alter table public.creator_subscription_settings
  drop constraint if exists creator_subscription_settings_normal_price_usd_check,
  drop constraint if exists creator_subscription_settings_promo_price_usd_check;

alter table public.creator_subscription_settings
  add constraint creator_subscription_settings_normal_price_usd_check
    check (normal_price_usd is null or (normal_price_usd between 3.99 and 19.99 and (normal_price_usd * 100)::integer % 10 in (0, 9))),
  add constraint creator_subscription_settings_promo_price_usd_check
    check (promo_price_usd is null or (promo_price_usd between 3.99 and 19.99 and (promo_price_usd * 100)::integer % 10 in (0, 9)));

comment on column public.creator_subscription_settings.normal_price_usd is
  'Creator base display price in USD; Telegram checkout remains integer XTR Stars.';
comment on column public.creator_subscription_settings.promo_price_usd is
  'Creator promotional display price in USD; Telegram checkout remains integer XTR Stars.';
