-- Recreate the carousel RPC and explicitly refresh PostgREST after the function is present.
-- This is safe to run after the original carousel migration because the signature is unchanged.
create or replace function public.create_creator_carousel(
  p_creator_id uuid,
  p_post_ids uuid[]
)
returns setof public.creator_posts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_carousel_id uuid;
  v_post_id uuid;
  v_position integer := 0;
begin
  if p_creator_id is null or coalesce(array_length(p_post_ids, 1), 0) < 2 then
    raise exception 'A carousel needs at least two posts.' using errcode = '22023';
  end if;

  if exists (
    select 1
      from unnest(p_post_ids) as requested(id)
     where requested.id is null
        or not exists (
          select 1
            from public.creator_posts post
           where post.id = requested.id
             and post.creator_id = p_creator_id
             and post.type = 'image'
        )
  ) then
    raise exception 'All selected posts must be image posts from the same creator.' using errcode = '22023';
  end if;

  if (select count(*) from unnest(p_post_ids)) <> (select count(distinct id) from unnest(p_post_ids) as unique_posts(id)) then
    raise exception 'A carousel cannot contain duplicate posts.' using errcode = '22023';
  end if;

  v_carousel_id := gen_random_uuid();

  foreach v_post_id in array p_post_ids loop
    update public.creator_posts
       set carousel_id = v_carousel_id,
           carousel_position = v_position,
           updated_at = now()
     where id = v_post_id;
    v_position := v_position + 1;
  end loop;

  return query
    select post.*
      from public.creator_posts post
     where post.carousel_id = v_carousel_id
     order by post.carousel_position;
end;
$$;

grant execute on function public.create_creator_carousel(uuid, uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';
