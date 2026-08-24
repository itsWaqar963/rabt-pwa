alter table public.profiles
  add column if not exists gender text,
  add column if not exists age_group text,
  add column if not exists city text,
  add column if not exists country text;
