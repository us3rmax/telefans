# TeleFans Supabase

Project: `telefans`
Project ref: `gtvzvvtnhmjtcgvjnfrr`
Project URL: `https://gtvzvvtnhmjtcgvjnfrr.supabase.co`
Status at discovery: `ACTIVE_HEALTHY`
Region: `us-west-2`

Migration applied successfully: `telefans_core_schema`.

Created public tables with RLS enabled: `admin_roles`, `creators`, `creator_posts`, `post_likes`, `post_comments`, and `post_views`. The schema includes unique creator slugs, creator-to-post relationships, `reels_enabled`, timestamps, admin role checking via `public.is_admin()`, and public-read/admin-write policies for published content.

Do not use or modify the unrelated project `telegram-groups-db` (`lymjjozpdsdoloahsyey`).

Seed migration applied successfully: `telefans_seed_public_creators`. Imported the existing public creator profiles and the initial Alex Mucci video with `published=true` and `reels_enabled=true`.
