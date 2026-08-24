import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type ChatMessage = {
  id: string;
  meetupId: string;
  senderId: string;
  body: string;
  createdAt: string;
  senderName: string;
  senderAvatarUrl?: string;
};

type ProfileEmbed = {
  full_name: string | null;
  avatar_url: string | null;
};

type MessageRow = {
  id: string;
  meetup_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  profiles?: ProfileEmbed | ProfileEmbed[] | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

const PROFILE_EMBED_COLS = "full_name, avatar_url";

function logRemoteError(scope: string, error: unknown): void {
  console.error(`[chat-sync] ${scope}`, error);
}

function asProfile(
  value: ProfileEmbed | ProfileEmbed[] | null | undefined,
): ProfileEmbed | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapRow(
  row: MessageRow,
  profile: ProfileEmbed | null,
): ChatMessage {
  const name = profile?.full_name?.trim() || "Member";
  const avatar = profile?.avatar_url?.trim() || undefined;
  return {
    id: row.id,
    meetupId: row.meetup_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    senderName: name,
    ...(avatar ? { senderAvatarUrl: avatar } : {}),
  };
}

async function fetchProfilesByIds(
  ids: string[],
): Promise<Map<string, ProfileRow>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, ProfileRow>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", unique);

  if (error) {
    logRemoteError("fetchProfilesByIds", error);
    return map;
  }

  for (const row of (data ?? []) as ProfileRow[]) {
    map.set(row.id, row);
  }
  return map;
}

async function enrichRows(rows: MessageRow[]): Promise<ChatMessage[]> {
  const missing = rows.filter((row) => !asProfile(row.profiles));
  const profileMap =
    missing.length > 0
      ? await fetchProfilesByIds(missing.map((r) => r.sender_id))
      : new Map<string, ProfileRow>();

  return rows.map((row) => {
    const embedded = asProfile(row.profiles);
    const fallback = profileMap.get(row.sender_id);
    const profile: ProfileEmbed | null = embedded ??
      (fallback
        ? { full_name: fallback.full_name, avatar_url: fallback.avatar_url }
        : null);
    return mapRow(row, profile);
  });
}

export async function fetchMessages(meetupId: string): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let rows: MessageRow[] | null = null;

    const embedded = await supabase
      .from("messages")
      .select(
        `id, meetup_id, sender_id, body, created_at, profiles!messages_sender_id_fkey(${PROFILE_EMBED_COLS})`,
      )
      .eq("meetup_id", meetupId)
      .order("created_at", { ascending: true });

    if (!embedded.error) {
      rows = (embedded.data ?? []) as MessageRow[];
    } else {
      const aliasRetry = await supabase
        .from("messages")
        .select(
          `id, meetup_id, sender_id, body, created_at, profiles:sender_id(${PROFILE_EMBED_COLS})`,
        )
        .eq("meetup_id", meetupId)
        .order("created_at", { ascending: true });

      if (!aliasRetry.error) {
        rows = (aliasRetry.data ?? []) as MessageRow[];
      } else {
        const plain = await supabase
          .from("messages")
          .select("id, meetup_id, sender_id, body, created_at")
          .eq("meetup_id", meetupId)
          .order("created_at", { ascending: true });

        if (plain.error) {
          logRemoteError("fetchMessages", plain.error);
          return [];
        }
        rows = (plain.data ?? []) as MessageRow[];
      }
    }

    return enrichRows(rows ?? []);
  } catch (err) {
    logRemoteError("fetchMessages", err);
    return [];
  }
}

export async function sendMessage(
  meetupId: string,
  body: string,
  senderId: string,
): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured) return null;

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 2000) return null;

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        meetup_id: meetupId,
        sender_id: senderId,
        body: trimmed,
      })
      .select("id, meetup_id, sender_id, body, created_at")
      .single();

    if (error || !data) {
      logRemoteError("sendMessage", error);
      return null;
    }

    const row = data as MessageRow;
    const profiles = await fetchProfilesByIds([senderId]);
    const profile = profiles.get(senderId) ?? null;
    return mapRow(
      row,
      profile
        ? { full_name: profile.full_name, avatar_url: profile.avatar_url }
        : null,
    );
  } catch (err) {
    logRemoteError("sendMessage", err);
    return null;
  }
}

export function subscribeMessages(
  meetupId: string,
  onInsert: (message: ChatMessage) => void,
): () => void {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`meetup-chat-${meetupId}-${crypto.randomUUID()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `meetup_id=eq.${meetupId}`,
      },
      (payload) => {
        void (async () => {
          try {
            const raw = payload.new as MessageRow;
            if (!raw?.id || !raw.sender_id) return;

            let profile = asProfile(raw.profiles);
            if (!profile) {
              const map = await fetchProfilesByIds([raw.sender_id]);
              const row = map.get(raw.sender_id);
              profile = row
                ? { full_name: row.full_name, avatar_url: row.avatar_url }
                : null;
            }

            onInsert(mapRow(raw, profile));
          } catch (err) {
            logRemoteError("subscribeMessages", err);
          }
        })();
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
