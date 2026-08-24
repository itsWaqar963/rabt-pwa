-- Drop broken synchronous webhook trigger on messages INSERT.
-- Error seen in client: 0A000 cross-database references are not implemented: extensions.net.http_post
-- That blocks every INSERT into public.messages.
--
-- DO NOT use a row-level pg_net / net.http_post trigger for push.
-- Use instead (pick one):
--   • Supabase Dashboard → Database → Webhooks → messages INSERT → /api/hooks/message-inserted
--   • Client fire-and-forget POST /api/notify-meetup-message after send

DROP TRIGGER IF EXISTS on_message_inserted_webhook ON public.messages;
DROP TRIGGER IF EXISTS message_inserted_webhook ON public.messages;
DROP TRIGGER IF EXISTS messages_insert_webhook ON public.messages;
DROP TRIGGER IF EXISTS tr_messages_insert_webhook ON public.messages;
DROP TRIGGER IF EXISTS webhook_messages_insert ON public.messages;

DROP FUNCTION IF EXISTS public.handle_message_inserted_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.notify_message_insert_webhook() CASCADE;

-- Drop any remaining user triggers on messages whose function name suggests HTTP/webhook
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.tgname AS trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_namespace pn ON pn.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'messages'
      AND NOT t.tgisinternal
      AND (
        p.proname ILIKE '%webhook%'
        OR p.proname ILIKE '%http_post%'
        OR p.proname = 'handle_message_inserted_webhook'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.messages', r.trigger_name);
  END LOOP;
END $$;
