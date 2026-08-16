-- Canonical creator slugs use lowercase alphanumeric tokens.
-- The frontend still resolves legacy hyphenated URLs for backwards compatibility.
update public.creators
set slug = regexp_replace(lower(slug), '[^a-z0-9]+', '', 'g')
where slug <> regexp_replace(lower(slug), '[^a-z0-9]+', '', 'g');
