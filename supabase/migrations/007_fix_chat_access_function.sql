-- Fix chat RLS helper: run as definer so nested meetups/join_requests checks
-- are not blocked by invoker RLS edge cases during INSERT/SELECT on messages.

create or replace function public.can_access_meetup_chat(p_meetup_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.meetups m
      where m.id = p_meetup_id
        and m.host_id = (select auth.uid())
    )
    or exists (
      select 1 from public.join_requests jr
      where jr.meetup_id = p_meetup_id
        and jr.requester_id = (select auth.uid())
        and jr.status = 'accepted'
    );
$$;

revoke all on function public.can_access_meetup_chat(uuid) from public;
grant execute on function public.can_access_meetup_chat(uuid) to authenticated;
