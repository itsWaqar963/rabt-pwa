/** Supabase Database Webhook + simplified test payloads for messages INSERT. */

export type MessageInsertRecord = {
  id?: string;
  meetup_id?: string;
  sender_id?: string;
  body?: string;
  created_at?: string;
};

type WebhookEnvelope = {
  type?: string;
  table?: string;
  schema?: string;
  record?: MessageInsertRecord;
  new?: MessageInsertRecord;
  old_record?: MessageInsertRecord | null;
  /** Some hook runners nest payload */
  payload?: WebhookEnvelope;
  /** Flat simplified shape */
  meetup_id?: string;
  sender_id?: string;
  body?: string;
  id?: string;
};

function asRecord(value: unknown): MessageInsertRecord | null {
  if (!value || typeof value !== "object") return null;
  const r = value as MessageInsertRecord;
  if (!r.meetup_id && !r.sender_id && !r.body) return null;
  return r;
}

/**
 * Parse Supabase Database Webhook body (INSERT on public.messages).
 * Accepts nested `payload`, `record`, `new`, or flat fields.
 */
export function extractMessageInsertRecord(
  body: unknown,
): MessageInsertRecord | null {
  if (!body || typeof body !== "object") return null;

  const root = body as WebhookEnvelope;
  const nested = root.payload && typeof root.payload === "object"
    ? root.payload
    : null;

  const candidates: unknown[] = [
    root.record,
    root.new,
    nested?.record,
    nested?.new,
    root,
  ];

  for (const candidate of candidates) {
    const record = asRecord(candidate);
    if (record?.meetup_id && record?.sender_id && record?.body) {
      return record;
    }
  }

  if (root.meetup_id && root.sender_id && root.body) {
    return {
      id: root.id,
      meetup_id: root.meetup_id,
      sender_id: root.sender_id,
      body: root.body,
    };
  }

  return null;
}

export function isMessagesInsertEvent(body: unknown): boolean {
  if (!body || typeof body !== "object") return true;
  const b = body as WebhookEnvelope;
  const nested = b.payload;
  const type = b.type ?? nested?.type;
  const table = b.table ?? nested?.table;
  const schema = b.schema ?? nested?.schema;
  if (type && type !== "INSERT") return false;
  if (table && table !== "messages") return false;
  if (schema && schema !== "public") return false;
  return true;
}
