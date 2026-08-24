-- Meetup group chat: hosts + accepted attendees.
-- IMPORTANT: enable Realtime replication for `messages` in Dashboard
-- (Database → Replication → supabase_realtime → add `messages`).

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_meetup_id_created_at_idx
  on public.messages (meetup_id, created_at);

alter table public.messages enable row level security;

grant select, insert on table public.messages to authenticated;

-- can_access_meetup_chat(meetup_id) := host OR accepted requester
create or replace function public.can_access_meetup_chat(p_meetup_id uuid)
returns boolean
language sql
stable
security invoker
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

drop policy if exists "Chat members can read messages" on public.messages;
drop policy if exists "Chat members can insert own messages" on public.messages;

create policy "Chat members can read messages"
  on public.messages for select to authenticated
  using (public.can_access_meetup_chat(meetup_id));

create policy "Chat members can insert own messages"
  on public.messages for insert to authenticated
  with check (
    public.can_access_meetup_chat(meetup_id)
    and (select auth.uid()) = sender_id
  );
