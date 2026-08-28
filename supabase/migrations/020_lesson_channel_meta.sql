alter table public.lesson_submissions
  add column if not exists is_own_channel boolean not null default false;

alter table public.lesson_submissions
  add column if not exists channel_title text;

alter table public.lesson_submissions
  add column if not exists channel_avatar_url text;
