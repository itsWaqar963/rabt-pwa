"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Send, X } from "lucide-react";
import { useChatNotify } from "@/components/providers/ChatNotifyProvider";
import { useAuth } from "@/context/AuthContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  fetchMessages,
  sendMessage,
  subscribeMessages,
  type ChatMessage,
} from "@/lib/chat-sync";
import { initialsFromName } from "@/lib/profile-store";

export type MeetupChatModalProps = {
  open: boolean;
  onClose: () => void;
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

export function MeetupChatModal({
  open,
  onClose,
  meetupId,
  meetupTitle,
  canChat,
}: MeetupChatModalProps) {
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();
  const { setActiveChatMeetupId } = useChatNotify();
  const [shell, setShell] = useState<HTMLElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myId = user?.id;

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    if (!open) {
      setActiveChatMeetupId(null);
      return;
    }
    setActiveChatMeetupId(meetupId);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      setActiveChatMeetupId(null);
      document.body.style.overflow = prev;
    };
  }, [open, meetupId, setActiveChatMeetupId]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !canChat || !meetupId) return;

    let cancelled = false;
    setLoading(true);
    setMessages([]);

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
  }, [open, canChat, meetupId]);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  if (!shell) return null;

  const duration = reducedMotion ? 0.01 : 0.28;
  const trimmed = draft.trim();
  const canSend =
    Boolean(myId) && canChat && trimmed.length > 0 && !isOffline && !sending;

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

  function onKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="rabt-modal-overlay absolute inset-0 z-[70] flex items-end justify-center px-4 pt-4">
          <motion.button
            type="button"
            aria-label="Close meetup chat"
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.22 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="rabt-modal-sheet relative z-[1] flex h-[min(72dvh,560px)] w-full max-w-[424px] flex-col overflow-hidden rounded-[24px] border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[linear-gradient(165deg,color-mix(in_oklch,var(--accent)_10%,var(--surface)),var(--surface)_45%,var(--bg))] shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_18%,transparent),0_28px_80px_color-mix(in_oklch,var(--bg)_80%,transparent)]"
            initial={
              reducedMotion ? false : { opacity: 0, y: 28, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 20, scale: 0.98 }
            }
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[color-mix(in_oklch,var(--border)_70%,transparent)] px-[18px] pb-3 pt-[18px]">
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                  Secure meetup chat
                </p>
                <h2
                  id={titleId}
                  className="mt-0.5 truncate font-display text-[20px] leading-tight text-foreground"
                >
                  {meetupTitle?.trim() || "Meetup chat"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-[color-mix(in_oklch,var(--surface)_80%,transparent)] text-foreground transition-[border-color,background,transform] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_8%,transparent)] active:scale-95"
              >
                <X className="size-4" strokeWidth={1.8} aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-[18px] py-3 [scrollbar-width:thin]">
              {!canChat ? (
                <p className="py-8 text-center text-[11px] leading-[1.45] text-muted">
                  Chat unlocks after the host accepts.
                </p>
              ) : loading && messages.length === 0 ? (
                <p className="py-8 text-center text-[11px] text-muted">
                  Loading…
                </p>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-[11px] text-muted">
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
              <div ref={messagesEndRef} aria-hidden />
            </div>

            <form
              onSubmit={onSubmit}
              className="rabt-modal-actions flex shrink-0 items-end gap-2 border-t border-[color-mix(in_oklch,var(--border)_70%,transparent)] px-[18px] pt-3"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={2000}
                placeholder={
                  canChat ? "Write a message…" : "Chat locked"
                }
                disabled={!canChat || isOffline || sending || !myId}
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
            {isOffline && canChat ? (
              <p className="-mt-1 mb-2 px-[18px] text-center font-mono text-[8px] uppercase tracking-[0.08em] text-muted opacity-50">
                Requires Internet
              </p>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    shell,
  );
}
