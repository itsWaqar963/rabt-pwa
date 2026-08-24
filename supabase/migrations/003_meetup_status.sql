-- Run in Supabase SQL Editor (or CLI). Adds meetup lifecycle status.
-- Required before client filters on status = 'open'.

alter table public.meetups
  add column if not exists status text not null default 'open'
  check (status in ('open', 'closed', 'cancelled'));
