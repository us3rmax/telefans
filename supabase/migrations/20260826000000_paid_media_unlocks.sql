-- Paid Media unlocks use the existing media_unlocks table from the production schema.
-- The original media URL is returned only after an atomic coin debit.

alter table public.coin_transactions
  drop constraint if exists coin_transactions_transaction_type_check;

alter table public.coin_transactions
  add constraint coin_transactions_transaction_type_check
  check (transaction_type in ('referral_signup', 'paid_unlock'));

create unique index if not exists media_unlocks_post_telegram_unique
  on public.media_unlocks (post_id, telegram_id);

create or replace function public.unlock_paid_media(
  p_post_id uuid,
  p_telegram_id bigint
)
returns table (
  media_url text,
  remaining_coins integer,
  already_unlocked boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  post_media_url text;
  post_creator_id uuid;
  post_price integer;
  current_balance integer;
  was_already_unlocked boolean;
begin
  if p_telegram_id is null or p_post_id is null then
    raise exception 'Invalid unlock request' using errcode = '22023';
  end if;

  select cp.media_url,
         cp.creator_id,
         greatest(0, ceil(coalesce(cp.unlock_price, 0))::integer)
    into post_media_url, post_creator_id, post_price
    from public.creator_posts cp
   where cp.id = p_post_id
     and cp.published = true
     and cp.status = 'published'
     and cp.is_paid = true
   for share;

  if not found or post_price <= 0 then
    raise exception 'Paid media is not available' using errcode = 'P0002';
  end if;

  select tu.coins_balance
    into current_balance
    from public.telegram_users tu
   where tu.telegram_id = p_telegram_id
   for update;

  if not found then
    raise exception 'Telegram account is not available' using errcode = 'P0003';
  end if;

  select exists (
    select 1
      from public.media_unlocks unlocks
     where unlocks.post_id = p_post_id
       and unlocks.telegram_id = p_telegram_id
  ) into was_already_unlocked;

  if was_already_unlocked then
    return query select post_media_url, current_balance, true;
    return;
  end if;

  if current_balance < post_price then
    raise exception 'Not enough coins' using errcode = 'P0001';
  end if;

  update public.telegram_users
     set coins_balance = coins_balance - post_price,
         updated_at = now()
   where telegram_id = p_telegram_id;

  insert into public.media_unlocks (post_id, telegram_id, price_paid)
  values (p_post_id, p_telegram_id, post_price);

  insert into public.coin_transactions (
    telegram_id,
    amount,
    transaction_type,
    referred_telegram_id,
    metadata
  ) values (
    p_telegram_id,
    -post_price,
    'paid_unlock',
    null,
    jsonb_build_object(
      'post_id', p_post_id,
      'creator_id', post_creator_id,
      'source', 'paid_media'
    )
  );

  return query
    select post_media_url, current_balance - post_price, false;
end;
$$;

revoke all on function public.unlock_paid_media(uuid, bigint) from public, anon, authenticated;
grant execute on function public.unlock_paid_media(uuid, bigint) to service_role;
