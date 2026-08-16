# TeleFans backend audit findings

## Production project

Supabase project: `gtvzvvtnhmjtcgvjnfrr` (`telefans`), status `ACTIVE_HEALTHY`, region `us-west-2`.

## Public tables and current row counts

| Table | Rows | RLS | Primary key |
|---|---:|---|---|
| admin_roles | 1 | enabled | user_id |
| creators | 5 | enabled | id |
| creator_posts | 115 | enabled | id |
| post_likes | 8 | enabled | id |
| post_comments | 12 | enabled | id |
| post_views | 138 | enabled | id |
| telegram_users | 4 | enabled | telegram_id |
| media_assets | 118 | enabled | id |
| creator_following | 0 | enabled | id |
| admin_audit_log | 240 | enabled | id |
| coin_transactions | 0 | enabled | id |

## Security advisories

1. `public.coin_transactions` has RLS enabled but no policies.
2. `public.is_admin()` is SECURITY DEFINER and executable by `anon` and `authenticated`; this needs restriction or safer invocation.
3. Supabase leaked-password protection is disabled.

## RLS observations

- `creator_posts` and `creators` have public SELECT policies restricted to published rows, plus admin access through `is_admin()`.
- `media_assets` public read is restricted to ready assets with a public URL.
- `post_likes`, `post_comments`, and `post_views` allow anonymous writes when a visitor_key exists.
- `creator_following` currently allows unrestricted public SELECT, INSERT, and DELETE (`true` policies); this is a security and integrity gap.
- `telegram_users` currently has public SELECT and unrestricted UPDATE policies (`true`), exposing/modifying user profiles beyond a Telegram identity boundary.
- `admin_audit_log` insert/read is guarded by `is_admin()`.
- Multiple permissive SELECT policies were reported for creators, creator_posts, media_assets, telegram_users and other tables, causing redundant policy evaluation.

## Frontend observations

- `listCreatorPosts()` reads all published posts and the public creator page now renders image posts plus the Paid Media subset.
- `uploadCreatorMediaBatch()` currently defaults images to free and accepts an explicit `paidImages` flag from the CRM.
- Likes use a browser visitor key and optional Telegram ID; comments and views currently use the same visitor key/Telegram ID model.
- The CRM loads large event sets client-side with limits (up to 5,000 rows per event type), so analytics will become incomplete at scale unless replaced with aggregate SQL/RPC views.
- `coin_transactions` currently has zero rows, so referral Coins and financial analytics need live-event verification.
- `creator_following` currently has zero rows, so follow-based CRM metrics cannot yet be validated against production activity.

Sources: Supabase `list_tables`, `get_advisors(security)`, `get_advisors(performance)`, and `pg_policies` query for project `gtvzvvtnhmjtcgvjnfrr`, retrieved 2026-08-16.
