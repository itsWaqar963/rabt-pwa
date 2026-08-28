alter table public.profiles add column if not exists is_vsila boolean not null default false;
alter table public.profiles add column if not exists custom_affiliation text;
