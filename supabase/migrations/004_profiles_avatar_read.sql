-- Without SELECT on peer profiles, clients cannot read other users' avatar_url
-- (Discover host avatars, MeetupCard organizers, join requesters).

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
  on public.profiles for select to authenticated
  using (true);
