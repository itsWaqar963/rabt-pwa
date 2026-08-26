-- Admin broadcasts (announce + web push). Shared project — apply once in SQL Editor.

create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target text not null default 'all'
    check (target in ('all', 'active')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  push_sent int not null default 0,
  push_failed int not null default 0
);

create index if not exists broadcasts_created_at_idx
  on public.broadcasts (created_at desc);

alter table public.broadcasts enable row level security;

grant select on table public.broadcasts to authenticated;
grant insert, update, delete on table public.broadcasts to authenticated;

drop policy if exists "Admins manage broadcasts" on public.broadcasts;
create policy "Admins manage broadcasts"
  on public.broadcasts for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Authenticated select broadcasts" on public.broadcasts;
create policy "Authenticated select broadcasts"
  on public.broadcasts for select to authenticated
  using (true);
