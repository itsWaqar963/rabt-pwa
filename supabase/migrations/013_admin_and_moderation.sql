-- Phase 0: admin users, lesson submissions, user/meetup reports (incl. hides).

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin'
    check (role in ('admin', 'moderator')),
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_submissions (
  id uuid primary key default gen_random_uuid(),
  youtube_url text not null,
  question text not null,
  options jsonb not null,
  correct_index int not null check (correct_index between 0 and 3),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  submitter_id uuid not null references auth.users (id) on delete cascade,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists lesson_submissions_submitter_id_idx
  on public.lesson_submissions (submitter_id);

create index if not exists lesson_submissions_status_idx
  on public.lesson_submissions (status);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_user_id uuid not null references auth.users (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (reporter_id, reported_user_id)
);

create index if not exists user_reports_reporter_id_idx
  on public.user_reports (reporter_id);

create table if not exists public.meetup_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  meetup_id uuid not null references public.meetups (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (reporter_id, meetup_id)
);

create index if not exists meetup_reports_reporter_id_idx
  on public.meetup_reports (reporter_id);

-- Admin gate: used by RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.lesson_submissions enable row level security;
alter table public.user_reports enable row level security;
alter table public.meetup_reports enable row level security;

grant select on table public.admin_users to authenticated;
grant select, insert, update, delete on table public.lesson_submissions to authenticated;
grant select, insert, update on table public.user_reports to authenticated;
grant select, insert, update on table public.meetup_reports to authenticated;

-- admin_users: admins may read; no public insert (seed via SQL / service role).
drop policy if exists "Admins can read admin_users" on public.admin_users;
create policy "Admins can read admin_users"
  on public.admin_users for select to authenticated
  using (public.is_admin());

-- lesson_submissions
drop policy if exists "Admins manage lesson_submissions" on public.lesson_submissions;
create policy "Admins manage lesson_submissions"
  on public.lesson_submissions for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users insert own lesson_submissions" on public.lesson_submissions;
create policy "Users insert own lesson_submissions"
  on public.lesson_submissions for insert to authenticated
  with check ((select auth.uid()) = submitter_id);

drop policy if exists "Users select own lesson_submissions" on public.lesson_submissions;
create policy "Users select own lesson_submissions"
  on public.lesson_submissions for select to authenticated
  using ((select auth.uid()) = submitter_id);

-- user_reports (hide + report; upsert needs update)
drop policy if exists "Admins manage user_reports" on public.user_reports;
create policy "Admins manage user_reports"
  on public.user_reports for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users insert own user_reports" on public.user_reports;
create policy "Users insert own user_reports"
  on public.user_reports for insert to authenticated
  with check ((select auth.uid()) = reporter_id);

drop policy if exists "Users select own user_reports" on public.user_reports;
create policy "Users select own user_reports"
  on public.user_reports for select to authenticated
  using ((select auth.uid()) = reporter_id);

drop policy if exists "Users update own user_reports" on public.user_reports;
create policy "Users update own user_reports"
  on public.user_reports for update to authenticated
  using ((select auth.uid()) = reporter_id)
  with check ((select auth.uid()) = reporter_id);

-- meetup_reports
drop policy if exists "Admins manage meetup_reports" on public.meetup_reports;
create policy "Admins manage meetup_reports"
  on public.meetup_reports for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users insert own meetup_reports" on public.meetup_reports;
create policy "Users insert own meetup_reports"
  on public.meetup_reports for insert to authenticated
  with check ((select auth.uid()) = reporter_id);

drop policy if exists "Users select own meetup_reports" on public.meetup_reports;
create policy "Users select own meetup_reports"
  on public.meetup_reports for select to authenticated
  using ((select auth.uid()) = reporter_id);

drop policy if exists "Users update own meetup_reports" on public.meetup_reports;
create policy "Users update own meetup_reports"
  on public.meetup_reports for update to authenticated
  using ((select auth.uid()) = reporter_id)
  with check ((select auth.uid()) = reporter_id);
