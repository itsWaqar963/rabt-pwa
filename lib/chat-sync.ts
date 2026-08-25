import {
  isJwtClockSkewError,
  recoverFromJwtClockSkew,
  withJwtRetry,
} from "@/lib/auth-retry";
import { isLocalCreatedMeetupId } from "@/lib/meetup-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type PostgrestErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type ChatMessage = {
  id: string;
  meetupId: string;
  senderId: string;
  body: string;
  createdAt: string;
  senderName: string;
  senderAvatarUrl?: string;
  /**
   * Client-only delivery ticks via Realtime Broadcast ACKs.
   * Offline→online receipts need DB columns later (broadcast only reaches online peers).
   */
  status?: "sent" | "delivered" | "read";
};

export type ChatAckKind = "ACK_DELIVERED" | "ACK_READ";

export type ChatAckPayload = {
  kind: ChatAckKind;
  meetupId: string;
  messageId: string;
  fromUserId: string;
};

type MessageStatus = NonNullable<ChatMessage["status"]>;

const STATUS_RANK: Record<MessageStatus, number> = {
  sent: 1,
  delivered: 2,
  read: 3,
};

function ackKindToStatus(kind: ChatAckKind): MessageStatus {
  switch (kind) {
    case "ACK_DELIVERED":
      return "delivered";
    case "ACK_READ":
      return "read";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/** Upgrade-only: sent → delivered → read. Never downgrade. */
export function applyAckToMessages(
  messages: ChatMessage[],
  messageId: string,
  kind: ChatAckKind,
): ChatMessage[] {
  const nextStatus = ackKindToStatus(kind);
  return messages.map((m) => {
    if (m.id !== messageId) return m;
    const current: MessageStatus = m.status ?? "sent";
    if (STATUS_RANK[nextStatus] <= STATUS_RANK[current]) return m;
    return { ...m, status: nextStatus };
  });
}

function ackChannelName(meetupId: string): string {
  return `meetup-acks-${meetupId}`;
}

/** In-flight ensureAckChannel promises — avoids duplicate subscribe races. */
const ackChannelEnsuring = new Map<string, Promise<ReturnType<typeof supabase.channel> | null>>();

function findAckChannel(meetupId: string) {
  const topic = ackChannelName(meetupId);
  const realtimeTopic = `realtime:${topic}`;
  return (
    supabase.getChannels().find((c) => {
      const t = c.topic;
      return t === realtimeTopic || t === topic || t.endsWith(`:${topic}`);
    }) ?? null
  );
}

/**
 * Ensure a joined Realtime broadcast channel for meetup ACKs.
 * Reuses existing channels; soft-fails (null) instead of throwing on timeout.
 */
export async function ensureAckChannel(
  meetupId: string,
): Promise<ReturnType<typeof supabase.channel> | null> {
  if (!isSupabaseConfigured) return null;

  const topic = ackChannelName(meetupId);
  const existing = findAckChannel(meetupId);
  if (existing && existing.state === "joined") {
    return existing;
  }

  const pending = ackChannelEnsuring.get(topic);
  if (pending) return pending;

  const ensurePromise = (async () => {
    try {
      let channel = findAckChannel(meetupId);
      if (!channel) {
        channel = supabase.channel(topic, {
          config: { broadcast: { self: false } },
        });
      }

      if (channel.state === "joined") return channel;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("ack channel subscribe timeout")),
          5000,
        );

        // Already joining — poll state instead of double-subscribe.
        if (channel!.state === "joining") {
          const iv = setInterval(() => {
            if (channel!.state === "joined") {
              clearInterval(iv);
              clearTimeout(timeout);
              resolve();
            } else if (channel!.state === "closed") {
              clearInterval(iv);
              clearTimeout(timeout);
              reject(new Error(channel!.state));
            }
          }, 100);
          return;
        }

        channel!.subscribe((next) => {
          if (next === "SUBSCRIBED") {
            clearTimeout(timeout);
            resolve();
          } else if (next === "CHANNEL_ERROR" || next === "TIMED_OUT") {
            clearTimeout(timeout);
            reject(new Error(next));
          }
        });
      });

      return channel;
    } catch (err) {
      console.warn("[chat-sync] ensureAckChannel soft-fail", formatSyncError(err));
      return null;
    } finally {
      ackChannelEnsuring.delete(topic);
    }
  })();

  ackChannelEnsuring.set(topic, ensurePromise);
  return ensurePromise;
}

export function subscribeChatAcks(
  meetupId: string,
  onAck: (payload: ChatAckPayload) => void,
): () => void {
  if (!isSupabaseConfigured) return () => {};

  const topic = ackChannelName(meetupId);
  const channel = supabase
    .channel(topic, {
      config: { broadcast: { self: false } },
    })
    .on("broadcast", { event: "chat_ack" }, ({ payload }) => {
      const raw = payload as Partial<ChatAckPayload> | null;
      if (!raw?.kind || !raw.messageId || !raw.meetupId || !raw.fromUserId) {
        return;
      }
      switch (raw.kind) {
        case "ACK_DELIVERED":
        case "ACK_READ":
          onAck({
            kind: raw.kind,
            meetupId: raw.meetupId,
            messageId: raw.messageId,
            fromUserId: raw.fromUserId,
          });
          break;
        default: {
          const _exhaustive: never = raw.kind;
          void _exhaustive;
        }
      }
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Broadcast ACK on `meetup-acks-${meetupId}`.
 * Reuses joined channel; soft-fails on timeout (never throws to callers).
 */
export async function broadcastChatAck(
  payload: ChatAckPayload,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const channel = await ensureAckChannel(payload.meetupId);
    if (!channel) return;

    const result = await channel.send({
      type: "broadcast",
      event: "chat_ack",
      payload,
    });
    if (result !== "ok") {
      console.warn("[chat-sync] broadcastChatAck.send", result);
    }
  } catch (err) {
    console.warn("[chat-sync] broadcastChatAck", formatSyncError(err));
  }
}

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

function formatSyncError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { raw: error };
  }
  const e = error as PostgrestErrorLike;
  return {
    message: e.message,
    code: e.code,
    details: e.details,
    hint: e.hint,
  };
}

function logRemoteError(scope: string, error: unknown): void {
  console.error(`[chat-sync] ${scope}`, formatSyncError(error));
}

/** Verified JWT user id for inserts — never trust React state alone. */
async function resolveChatSenderId(
  senderHint?: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (data.user?.id) {
    if (senderHint && senderHint !== data.user.id) {
      console.warn("[chat-sync] sendMessage sender hint mismatch", {
        senderHint,
        sessionUserId: data.user.id,
      });
    }
    return data.user.id;
  }

  logRemoteError("sendMessage.getUser", error ?? "no user");

  const refreshed = await supabase.auth.refreshSession();
  const sessionUserId = refreshed.data.session?.user?.id ?? null;
  if (sessionUserId) {
    if (senderHint && senderHint !== sessionUserId) {
      console.warn("[chat-sync] sendMessage sender hint mismatch", {
        senderHint,
        sessionUserId,
      });
    }
    return sessionUserId;
  }

  logRemoteError(
    "sendMessage.refreshSession",
    refreshed.error ?? "no session after refresh",
  );
  return null;
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
    const { data, error } = await withJwtRetry(async () => {
      const res = await supabase
        .from("messages")
        .select("id, meetup_id, sender_id, body, created_at")
        .eq("meetup_id", meetupId)
        .order("created_at", { ascending: true });
      return { data: res.data, error: res.error };
    });

    if (error) {
      logRemoteError("fetchMessages", error);
      return [];
    }

    return enrichRows((data ?? []) as MessageRow[]);
  } catch (err) {
    logRemoteError("fetchMessages", err);
    return [];
  }
}

async function fetchOwnMessageRow(
  meetupId: string,
  senderId: string,
  body: string,
): Promise<MessageRow | null> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, meetup_id, sender_id, body, created_at")
    .eq("meetup_id", meetupId)
    .eq("sender_id", senderId)
    .eq("body", body)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logRemoteError("sendMessage.selectAfterInsert", error);
    return null;
  }

  return (data as MessageRow | null) ?? null;
}

export async function sendMessage(
  meetupId: string,
  body: string,
  senderIdHint?: string,
): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured) {
    logRemoteError("sendMessage", "supabase env not configured");
    return null;
  }

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 2000) {
    logRemoteError("sendMessage", "invalid body length");
    return null;
  }

  const meetupKey = meetupId.trim();
  if (!meetupKey) {
    logRemoteError("sendMessage", "missing meetupId");
    return null;
  }

  if (isLocalCreatedMeetupId(meetupKey)) {
    logRemoteError("sendMessage", {
      code: "LOCAL_MEETUP",
      message: "Meetup not synced to Supabase — chat requires remote meetup id",
      meetupId: meetupKey,
    });
    return null;
  }

  try {
    const senderId = await resolveChatSenderId(senderIdHint);
    if (!senderId) return null;

    const payload = {
      meetup_id: meetupKey,
      sender_id: senderId,
      body: trimmed,
    };

    let insertError = (
      await supabase.from("messages").insert(payload)
    ).error;

    if (insertError && isJwtClockSkewError(insertError)) {
      const recovered = await recoverFromJwtClockSkew(insertError);
      if (recovered) {
        insertError = (
          await supabase.from("messages").insert(payload)
        ).error;
      }
    }

    if (insertError) {
      logRemoteError("sendMessage.insert", insertError);
      // 0A000 = leftover sync webhook trigger (extensions.net.http_post)
      if (
        insertError.code === "0A000" ||
        (insertError.message ?? "").includes("http_post")
      ) {
        logRemoteError("sendMessage.insert", {
          code: "WEBHOOK_TRIGGER",
          message:
            "messages INSERT blocked by sync HTTP trigger — run migration 011",
        });
      }
    }

    const row = await fetchOwnMessageRow(meetupKey, senderId, trimmed);

    if (!row) {
      if (!insertError) {
        logRemoteError("sendMessage", "insert ok but row not readable");
      }
      return null;
    }

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
