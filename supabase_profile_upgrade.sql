alter table public.telegram_users
  add column if not exists bio text not null default '',
  add column if not exists gender text not null default 'prefer_not_to_say',
  add column if not exists date_of_birth date,
  add column if not exists profile_photo_url text;

alter table public.telegram_users enable row level security;

drop policy if exists "telegram users can read own profile" on public.telegram_users;
drop policy if exists "telegram users can update own profile" on public.telegram_users;

create policy "telegram users can read own profile"
on public.telegram_users for select
to anon, authenticated
using (true);

create policy "telegram users can update own profile"
on public.telegram_users for update
to anon, authenticated
using (true)
with check (true);
