-- Drop Supabase Database Webhook row trigger that blocks messages INSERT.
-- Live trigger: "send-push-on-message" → supabase_functions.http_request()
-- which calls extensions.net.http_post and fails with:
--   0A000 cross-database references are not implemented: extensions.net.http_post
--
-- Push must stay async outside the INSERT transaction:
--   • App: POST /api/notify-meetup-message after successful send
--   • Optional: Dashboard Webhook only if it does NOT attach a sync trigger
--     (or use Logical Replication / Edge Function after commit)

DROP TRIGGER IF EXISTS "send-push-on-message" ON public.messages;
DROP TRIGGER IF EXISTS send_push_on_message ON public.messages;
DROP TRIGGER IF EXISTS "supabase_functions_http_request" ON public.messages;

-- Drop EVERY user trigger on public.messages that invokes http/webhook helpers
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.tgname AS trigger_name, p.proname, n2.nspname AS func_schema
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_namespace n2 ON n2.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'messages'
      AND NOT t.tgisinternal
      AND (
        p.proname ILIKE '%http%'
        OR p.proname ILIKE '%webhook%'
        OR p.proname ILIKE '%push%'
        OR n2.nspname = 'supabase_functions'
        OR pg_get_functiondef(p.oid) ILIKE '%http_post%'
        OR pg_get_functiondef(p.oid) ILIKE '%net.http%'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.messages', r.trigger_name);
    RAISE NOTICE 'Dropped trigger % (%.%) on public.messages',
      r.trigger_name, r.func_schema, r.proname;
  END LOOP;
END $$;

-- Safety: no remaining non-internal triggers on messages should call net/http
DO $$
DECLARE
  leftover text;
BEGIN
  SELECT string_agg(t.tgname, ', ')
  INTO leftover
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_proc p ON p.oid = t.tgfoid
  JOIN pg_namespace n2 ON n2.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'messages'
    AND NOT t.tgisinternal
    AND (
      n2.nspname = 'supabase_functions'
      OR pg_get_functiondef(p.oid) ILIKE '%http_post%'
    );

  IF leftover IS NOT NULL THEN
    RAISE EXCEPTION 'messages still has HTTP triggers: %', leftover;
  END IF;
END $$;
