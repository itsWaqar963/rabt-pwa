-- Screen taglines (CMS)
create table if not exists public.app_screen_taglines (
  screen text primary key check (screen in ('discover','meetups','reflect','profile')),
  title_lead text not null,
  title_accent text not null,
  subtitle text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Seed defaults (upsert on conflict)
insert into public.app_screen_taglines (screen, title_lead, title_accent, subtitle) values
  ('discover', 'Find your ', 'cluster.', 'Real people. Shared intent. A reason to meet offline.'),
  ('meetups', 'Meet with ', 'intent.', 'Small gatherings for useful conversations, shared practice, and a reason to show up.'),
  ('reflect', 'Reflect ', '& grow.', 'Verify your physical meetups, build community trust, and claim your growth XP.'),
  ('profile', 'Show up as ', 'yourself.', 'A clear signal for people who want to turn shared intent into real local connection.')
on conflict (screen) do nothing;

alter table public.app_screen_taglines enable row level security;
grant select on public.app_screen_taglines to anon, authenticated;
grant all on public.app_screen_taglines to authenticated;

drop policy if exists "Anyone can read taglines" on public.app_screen_taglines;
create policy "Anyone can read taglines"
  on public.app_screen_taglines for select to anon, authenticated using (true);

drop policy if exists "Admins manage taglines" on public.app_screen_taglines;
create policy "Admins manage taglines"
  on public.app_screen_taglines for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Banners
create table if not exists public.app_banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  link_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_banners enable row level security;
grant select on public.app_banners to anon, authenticated;
grant all on public.app_banners to authenticated;

drop policy if exists "Anyone can read active banners" on public.app_banners;
create policy "Anyone can read active banners"
  on public.app_banners for select to anon, authenticated using (is_active = true);

drop policy if exists "Admins read all banners" on public.app_banners;
create policy "Admins read all banners"
  on public.app_banners for select to authenticated using (public.is_admin());

drop policy if exists "Admins manage banners" on public.app_banners;
create policy "Admins manage banners"
  on public.app_banners for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
