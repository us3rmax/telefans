-- `is_admin()` only checks the caller's own admin_roles row.
-- SECURITY INVOKER prevents public callers from executing it with elevated privileges.
create or replace function public.is_admin()
returns boolean
language sql
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles
    where user_id = auth.uid()
  );
$$;
