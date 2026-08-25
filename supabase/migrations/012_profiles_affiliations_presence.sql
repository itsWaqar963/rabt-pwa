-- Affiliations + presence + ensure messages cascade on meetup delete.

alter table public.profiles
  add column if not exists is_source_code_academia boolean default false;

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- Idempotent: recreate FK with ON DELETE CASCADE if missing or non-cascading.
do $$
declare
  fk_name text;
begin
  select tc.constraint_name into fk_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'messages'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'meetup_id'
  limit 1;

  if fk_name is not null then
    execute format('alter table public.messages drop constraint %I', fk_name);
  end if;

  alter table public.messages
    add constraint messages_meetup_id_fkey
    foreign key (meetup_id) references public.meetups (id) on delete cascade;
exception
  when duplicate_object then
    null;
end $$;
