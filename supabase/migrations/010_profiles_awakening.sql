-- Track awakening / ice-breaker quiz completion per user.

alter table public.profiles
  add column if not exists awakening_completed_at timestamptz;
