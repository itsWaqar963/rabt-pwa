"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  PRESENCE_HEARTBEAT_MS,
  touchLastSeen,
} from "@/lib/presence";

/** Upserts own `profiles.last_seen_at` on focus + every ~50s while visible. */
export function PresenceHeartbeat() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const beat = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      void touchLastSeen(userId);
    };

    const start = () => {
      beat();
      if (timer) clearInterval(timer);
      timer = setInterval(beat, PRESENCE_HEARTBEAT_MS);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    };

    const onFocus = () => {
      void touchLastSeen(userId);
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId]);

  return null;
}
