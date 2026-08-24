"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useMeetupStore } from "@/components/providers/MeetupStoreProvider";
import { useAuth } from "@/context/AuthContext";
import { playChatSound } from "@/lib/chat-sounds";
import { subscribeMessages } from "@/lib/chat-sync";

type ChatToast = {
  messageId: string;
  meetupId: string;
  title: string;
};

type PendingOpenChat = {
  meetupId: string;
  title: string;
};

type ChatNotifyValue = {
  activeChatMeetupId: string | null;
  setActiveChatMeetupId: (id: string | null) => void;
  pendingOpenChat: PendingOpenChat | null;
  requestOpenChat: (meetupId: string, title: string) => void;
  clearPendingOpenChat: () => void;
};

const ChatNotifyContext = createContext<ChatNotifyValue | null>(null);

const EASE = [0.22, 1, 0.36, 1] as const;
const TOAST_MS = 3500;

function ChatInboxListener({
  activeChatMeetupId,
  onToast,
}: {
  activeChatMeetupId: string | null;
  onToast: (toast: ChatToast) => void;
}) {
  const { user } = useAuth();
  const { hydrated, createdMeetups, joinRequests, remoteMeetups } =
    useMeetupStore();
  const myId = user?.id;
  const activeRef = useRef(activeChatMeetupId);
  const onToastRef = useRef(onToast);

  activeRef.current = activeChatMeetupId;
  onToastRef.current = onToast;

  const eligible = useMemo(() => {
    const titles = new Map<string, string>();
    for (const m of remoteMeetups) {
      titles.set(m.id, m.title);
    }
    for (const m of createdMeetups) {
      titles.set(m.id, m.title);
    }

    const ids = new Set<string>();
    for (const m of createdMeetups) {
      ids.add(m.id);
    }
    if (myId) {
      for (const m of remoteMeetups) {
        if (m.hostUserId === myId) ids.add(m.id);
      }
    }
    for (const [meetupId, status] of Object.entries(joinRequests)) {
      if (status === "accepted") ids.add(meetupId);
    }

    return Array.from(ids).map((id) => ({
      id,
      title: titles.get(id) ?? "Meetup",
    }));
  }, [createdMeetups, joinRequests, remoteMeetups, myId]);

  const eligibleKey = eligible.map((e) => e.id).sort().join(",");

  useEffect(() => {
    if (!hydrated || !myId || eligible.length === 0) return;

    const unsubs = eligible.map(({ id, title }) =>
      subscribeMessages(id, (msg) => {
        if (msg.senderId === myId) return;
        if (activeRef.current === id) return;
        onToastRef.current({ messageId: msg.id, meetupId: id, title });
      }),
    );

    return () => {
      for (const unsub of unsubs) unsub();
    };
    // eligibleKey captures membership; titles refresh with eligible array rebuild
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subscribe by id set
  }, [hydrated, myId, eligibleKey]);

  return null;
}

function ChatToastBanner({
  toast,
  onOpen,
  onDismiss,
}: {
  toast: ChatToast | null;
  onOpen: (meetupId: string, title: string) => void;
  onDismiss: () => void;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.messageId}
          initial={reducedMotion ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
          transition={{ duration: reducedMotion ? 0.12 : 0.32, ease: EASE }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[65] flex justify-center px-3 pt-[max(12px,env(safe-area-inset-top,0px))]"
        >
          <button
            type="button"
            onClick={() => {
              onOpen(toast.meetupId, toast.title);
              onDismiss();
            }}
            className="pointer-events-auto flex w-full max-w-[calc(28rem-24px)] cursor-pointer items-center gap-2.5 rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_50%,var(--border))] bg-[color-mix(in_oklch,oklch(0.2_0.03_165)_90%,var(--surface))] px-3.5 py-2.5 text-left shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_18%,transparent),0_0_28px_color-mix(in_oklch,var(--accent)_22%,transparent),0_8px_24px_color-mix(in_oklch,var(--bg)_75%,transparent)] backdrop-blur-md transition-[transform,opacity] duration-150 hover:opacity-95 active:scale-[0.99]"
          >
            <MessageCircle
              className="size-3.5 shrink-0 text-accent"
              strokeWidth={2}
              aria-hidden
            />
            <p className="min-w-0 truncate text-[11px] font-medium leading-snug text-[color-mix(in_oklch,var(--accent)_35%,var(--fg))]">
              New message in {toast.title}
            </p>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ChatNotifyProvider({ children }: { children: ReactNode }) {
  const [activeChatMeetupId, setActiveChatMeetupIdState] = useState<
    string | null
  >(null);
  const [pendingOpenChat, setPendingOpenChat] =
    useState<PendingOpenChat | null>(null);
  const [toast, setToast] = useState<ChatToast | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveChatMeetupId = useCallback((id: string | null) => {
    setActiveChatMeetupIdState(id);
  }, []);

  const requestOpenChat = useCallback((meetupId: string, title: string) => {
    setPendingOpenChat({ meetupId, title });
  }, []);

  const clearPendingOpenChat = useCallback(() => {
    setPendingOpenChat(null);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const showToast = useCallback((next: ChatToast) => {
    if (seenIdsRef.current.has(next.messageId)) return;
    seenIdsRef.current.add(next.messageId);
    if (seenIdsRef.current.size > 80) {
      const keep = Array.from(seenIdsRef.current).slice(-40);
      seenIdsRef.current = new Set(keep);
    }
    setToast(next);
    playChatSound("ting");
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setToast(null);
      dismissTimerRef.current = null;
    }, TOAST_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const value = useMemo<ChatNotifyValue>(
    () => ({
      activeChatMeetupId,
      setActiveChatMeetupId,
      pendingOpenChat,
      requestOpenChat,
      clearPendingOpenChat,
    }),
    [
      activeChatMeetupId,
      setActiveChatMeetupId,
      pendingOpenChat,
      requestOpenChat,
      clearPendingOpenChat,
    ],
  );

  return (
    <ChatNotifyContext.Provider value={value}>
      {children}
      <ChatInboxListener
        activeChatMeetupId={activeChatMeetupId}
        onToast={showToast}
      />
      <ChatToastBanner
        toast={toast}
        onOpen={requestOpenChat}
        onDismiss={dismissToast}
      />
    </ChatNotifyContext.Provider>
  );
}

export function useChatNotify(): ChatNotifyValue {
  const ctx = useContext(ChatNotifyContext);
  if (!ctx) {
    throw new Error("useChatNotify must be used within ChatNotifyProvider");
  }
  return ctx;
}
