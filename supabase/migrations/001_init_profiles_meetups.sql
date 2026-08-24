-- Paste in Supabase SQL Editor (or run via CLI). Idempotent-ish: IF NOT EXISTS + drop policies.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  active_intent text,
  skills text[] default '{}'::text[],
  social_urls jsonb default '{}'::jsonb,
  introvert_extrovert int,
  subline text,
  is_ims_student boolean default false,
  updated_at timestamptz default now()
);

create table if not exists public.meetups (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text,
  venue text,
  date date,
  time text,
  max_spots int,
  city text,
  country text,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups (id) on delete cascade,
  requester_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  unique (meetup_id, requester_id)
);

create index if not exists meetups_host_id_idx on public.meetups (host_id);
create index if not exists join_requests_meetup_id_idx on public.join_requests (meetup_id);
create index if not exists join_requests_requester_id_idx on public.join_requests (requester_id);

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.meetups to authenticated;
grant select, insert, update on table public.join_requests to authenticated;

alter table public.profiles enable row level security;
alter table public.meetups enable row level security;
alter table public.join_requests enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Authenticated users can read profiles"
  on public.profiles for select to authenticated
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Authenticated users can read meetups" on public.meetups;
drop policy if exists "Hosts can insert meetups" on public.meetups;
drop policy if exists "Hosts can update own meetups" on public.meetups;
drop policy if exists "Hosts can delete own meetups" on public.meetups;

create policy "Authenticated users can read meetups"
  on public.meetups for select to authenticated
  using (true);

create policy "Hosts can insert meetups"
  on public.meetups for insert to authenticated
  with check ((select auth.uid()) = host_id);

create policy "Hosts can update own meetups"
  on public.meetups for update to authenticated
  using ((select auth.uid()) = host_id)
  with check ((select auth.uid()) = host_id);

create policy "Hosts can delete own meetups"
  on public.meetups for delete to authenticated
  using ((select auth.uid()) = host_id);

drop policy if exists "Requesters and hosts can read join requests" on public.join_requests;
drop policy if exists "Requesters can insert own join requests" on public.join_requests;
drop policy if exists "Hosts can update join request status" on public.join_requests;

create policy "Requesters and hosts can read join requests"
  on public.join_requests for select to authenticated
  using (
    (select auth.uid()) = requester_id
    or exists (
      select 1 from public.meetups m
      where m.id = join_requests.meetup_id
        and m.host_id = (select auth.uid())
    )
  );

create policy "Requesters can insert own join requests"
  on public.join_requests for insert to authenticated
  with check ((select auth.uid()) = requester_id);

create policy "Hosts can update join request status"
  on public.join_requests for update to authenticated
  using (
    exists (
      select 1 from public.meetups m
      where m.id = join_requests.meetup_id
        and m.host_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.meetups m
      where m.id = join_requests.meetup_id
        and m.host_id = (select auth.uid())
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
