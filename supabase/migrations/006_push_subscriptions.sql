-- Web Push subscriptions (VAPID). Users manage own rows via RLS.
-- Server send-push uses SUPABASE_SERVICE_ROLE_KEY to read recipients' rows.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  subscription_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

grant select, insert, update, delete on table public.push_subscriptions to authenticated;

drop policy if exists "Users can select own push subscriptions" on public.push_subscriptions;
drop policy if exists "Users can insert own push subscriptions" on public.push_subscriptions;
drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
drop policy if exists "Users can delete own push subscriptions" on public.push_subscriptions;

create policy "Users can select own push subscriptions"
  on public.push_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Note: service_role bypasses RLS. Next.js API routes that send push must use
-- SUPABASE_SERVICE_ROLE_KEY (server-only) to load other users' subscriptions.
