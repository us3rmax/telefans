alter table public.creator_posts
  add column if not exists is_paid boolean not null default false,
  add column if not exists unlock_price numeric(10,2) not null default 5.00;

update public.creator_posts
set is_paid = true,
    unlock_price = case when unlock_price <= 0 then 5.00 else unlock_price end
where type = 'image'
  and reels_enabled = false;

create index if not exists creator_posts_paid_media_idx
  on public.creator_posts (creator_id, is_paid, status, created_at desc);
