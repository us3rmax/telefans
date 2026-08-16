-- Backend hardening for the TeleFans CRM.
-- Coin ledger is private and is only readable by authenticated admins.
create policy coin_transactions_admin_read
  on public.coin_transactions
  for select
  to public
  using (is_admin());

-- Telegram profile writes must go through the signed Telegram auth Edge Function.
-- The public read policy remains for the current comment-author lookup flow.
drop policy if exists "telegram users can update own profile" on public.telegram_users;

comment on policy coin_transactions_admin_read on public.coin_transactions is
  'Only administrators may read the coin ledger used by CRM analytics.';
