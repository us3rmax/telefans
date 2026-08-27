alter table public.telegram_users
  add column if not exists location_city text,
  add column if not exists location_state text,
  add column if not exists location_country text,
  add column if not exists location_detected_at timestamptz;

comment on column public.telegram_users.location_city is
  'Approximate city inferred once from the Telegram authentication request IP.';
comment on column public.telegram_users.location_state is
  'Approximate state or region inferred once from the Telegram authentication request IP.';
comment on column public.telegram_users.location_country is
  'Approximate country inferred once from the Telegram authentication request IP.';
comment on column public.telegram_users.location_detected_at is
  'Time when the approximate location was first detected; not periodically refreshed.';
