"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  fetchMessages,
  sendMessage,
  subscribeMessages,
  type ChatMessage,
} from "@/lib/chat-sync";
import { initialsFromName } from "@/lib/profile-store";

export type MeetupChatPanelProps = {
  meetupId: string;
  meetupTitle?: string;
  canChat: boolean;
};

function formatMsgTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function ChatAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  const initials = initialsFromName(name);
  const src = avatarUrl?.trim() || undefined;
  return (
    <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full border border-[color-mix(in_oklch,var(--accent)_35%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote chat avatar
        <img src={src} alt="" className="size-full rounded-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="font-display text-[9px] font-semibold leading-none text-accent"
        >
          {initials}
        </span>
      )}
    </span>
  );
}

export function MeetupChatPanel({
  meetupId,
  meetupTitle,
  canChat,
}: MeetupChatPanelProps) {
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const myId = user?.id;

  useEffect(() => {
    if (!canChat || !meetupId) return;

    let cancelled = false;
    setLoading(true);

    void fetchMessages(meetupId).then((rows) => {
      if (cancelled) return;
      setMessages(rows);
      setLoading(false);
    });

    const unsubscribe = subscribeMessages(meetupId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [canChat, meetupId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  if (!canChat) {
    return (
      <div className="mt-2 rounded-[12px] border border-dashed border-border bg-[color-mix(in_oklch,var(--surface)_60%,transparent)] px-3 py-4 text-center">
        <p className="text-[11px] leading-[1.45] text-muted">
          Chat unlocks after the host accepts.
        </p>
      </div>
    );
  }

  const trimmed = draft.trim();
  const canSend = Boolean(myId) && trimmed.length > 0 && !isOffline && !sending;

  async function handleSend() {
    if (!canSend || !myId) return;
    setSending(true);
    const body = trimmed;
    setDraft("");
    const created = await sendMessage(meetupId, body, myId);
    if (created) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev;
        return [...prev, created];
      });
    } else {
      setDraft(body);
    }
    setSending(false);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void handleSend();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="mt-2 rounded-[12px] border border-border bg-[color-mix(in_oklch,var(--surface)_70%,transparent)] px-3 py-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
        {meetupTitle ? `Chat · ${meetupTitle}` : "Secure meetup chat"}
      </p>

      <div className="mt-2 max-h-[280px] space-y-2.5 overflow-y-auto overscroll-contain pr-0.5">
        {loading && messages.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-muted">
            No messages yet — say salaam.
          </p>
        ) : (
          messages.map((msg) => {
            const mine = Boolean(myId) && msg.senderId === myId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
              >
                <ChatAvatar
                  name={msg.senderName}
                  avatarUrl={msg.senderAvatarUrl}
                />
                <div
                  className={`min-w-0 max-w-[78%] ${mine ? "items-end text-right" : "items-start text-left"}`}
                >
                  <div
                    className={`mb-0.5 flex items-baseline gap-1.5 ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <span className="truncate text-[10px] font-semibold text-foreground">
                      {mine ? "You" : msg.senderName}
                    </span>
                    <span className="shrink-0 font-mono text-[8px] text-muted">
                      {formatMsgTime(msg.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`inline-block rounded-[11px] px-2.5 py-1.5 text-[11px] leading-[1.45] ${
                      mine
                        ? "bg-accent text-[oklch(0.18_0.03_165)]"
                        : "border border-border bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] text-foreground"
                    }`}
                  >
                    {msg.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} aria-hidden />
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-2.5 flex items-end gap-2 border-t border-[color-mix(in_oklch,var(--border)_72%,transparent)] pt-2.5"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={2000}
          placeholder="Write a message…"
          disabled={isOffline || sending || !myId}
          className="min-h-10 max-h-24 flex-1 resize-none rounded-[11px] border border-border bg-[color-mix(in_oklch,var(--bg)_55%,transparent)] px-2.5 py-2 text-[11px] text-foreground placeholder:text-muted focus:border-[color-mix(in_oklch,var(--accent)_50%,var(--border))] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend}
          className={`inline-flex size-10 shrink-0 items-center justify-center rounded-[11px] border transition-[background,opacity] duration-150 ${
            !canSend
              ? "cursor-not-allowed border-border bg-transparent text-muted opacity-50"
              : "border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-accent hover:bg-[color-mix(in_oklch,var(--accent)_22%,transparent)]"
          }`}
          aria-label={isOffline ? "Requires Internet" : "Send message"}
        >
          <Send className="size-3.5" strokeWidth={1.8} aria-hidden />
        </button>
      </form>
      {isOffline ? (
        <p className="mt-1.5 text-center font-mono text-[8px] uppercase tracking-[0.08em] text-muted opacity-50">
          Requires Internet
        </p>
      ) : null}
    </div>
  );
}
