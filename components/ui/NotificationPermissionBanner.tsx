"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, BellOff, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  hasPushSubscription,
  isVapidPublicConfigured,
  registerPushSubscription,
} from "@/lib/push-subscribe";

/** Session-only dismiss — permanent dismiss only after granted + subscribe. */
const SESSION_DISMISS_KEY = "rabt_notify_banner_session_dismissed";
const EASE = [0.22, 1, 0.36, 1] as const;

type Perm = NotificationPermission | "unsupported";

function readSessionDismissed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function writeSessionDismissed(): void {
  try {
    sessionStorage.setItem(SESSION_DISMISS_KEY, "true");
  } catch {
    /* quota / private */
  }
}

/**
 * Soft in-app invite to enable notifications when permission is not granted,
 * or when granted but PushSubscription is missing (e.g. after reinstall —
 * OS may show "Managed by RABT" while push endpoint is gone).
 * Does not call requestPermission on mount (that permanently blocks without gesture).
 */
export function NotificationPermissionBanner() {
  const { user, isAuthenticated } = useAuth();
  const reducedMotion = useReducedMotion();
  const [perm, setPerm] = useState<Perm>("default");
  const [hasSub, setHasSub] = useState(true);
  const [sessionDismissed, setSessionDismissed] = useState(true);
  const [busy, setBusy] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (typeof Notification === "undefined") {
      setPerm("unsupported");
      setHasSub(false);
      return;
    }
    const permission = Notification.permission;
    setPerm(permission);
    if (permission === "granted" && "serviceWorker" in navigator) {
      const sub = await hasPushSubscription();
      setHasSub(sub);
    } else {
      setHasSub(false);
    }
  }, []);

  useEffect(() => {
    setSessionDismissed(readSessionDismissed());
    void refreshStatus();

    const onVis = () => {
      if (document.visibilityState === "visible") void refreshStatus();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshStatus, user?.id]);

  const needsAttention =
    perm === "default" ||
    perm === "denied" ||
    (perm === "granted" && !hasSub);

  const show =
    isAuthenticated &&
    Boolean(user?.id) &&
    isVapidPublicConfigured() &&
    !sessionDismissed &&
    needsAttention;

  const isBlocked = perm === "denied";
  const needsResub = perm === "granted" && !hasSub;

  const onEnable = useCallback(async () => {
    if (busy || typeof Notification === "undefined") return;
    setBusy(true);
    try {
      if (Notification.permission === "denied") {
        await refreshStatus();
        return;
      }

      let result: NotificationPermission = Notification.permission;
      if (result !== "granted") {
        result = await Notification.requestPermission();
      }
      setPerm(result);

      if (result === "granted" && "serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const ok = await registerPushSubscription(reg);
        setHasSub(ok);
        if (ok) {
          setSessionDismissed(true);
        }
      }
    } catch (err) {
      console.info("[notify-banner] enable soft-fail", err);
    } finally {
      setBusy(false);
    }
  }, [busy, refreshStatus]);

  const onDismiss = useCallback(() => {
    writeSessionDismissed();
    setSessionDismissed(true);
  }, []);

  let title = "Enable message alerts";
  let body =
    "Get notified when meetup chat messages arrive, even if the app is minimized.";
  if (isBlocked) {
    title = "Notifications are blocked for RABT";
    body =
      "Tap the lock icon in the address bar → Site settings → Notifications → Allow, then reload.";
  } else if (needsResub) {
    title = "Re-enable message alerts";
    body =
      "Permission looks allowed, but push delivery is not set up yet. Tap Enable to finish.";
  }

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="notify-banner"
          role="status"
          aria-live="polite"
          initial={reducedMotion ? false : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -14 }}
          transition={{ duration: reducedMotion ? 0.12 : 0.32, ease: EASE }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[62] flex justify-center px-3 pt-[max(10px,env(safe-area-inset-top,0px))]"
        >
          <div className="pointer-events-auto flex w-full max-w-[calc(28rem-24px)] items-start gap-2.5 rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[color-mix(in_oklch,oklch(0.2_0.03_165)_90%,var(--surface))] px-3 py-2.5 shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_16%,transparent),0_0_24px_color-mix(in_oklch,var(--accent)_18%,transparent),0_8px_24px_color-mix(in_oklch,var(--bg)_75%,transparent)] backdrop-blur-md">
            {isBlocked ? (
              <BellOff
                className="mt-0.5 size-3.5 shrink-0 text-muted"
                strokeWidth={2}
                aria-hidden
              />
            ) : (
              <Bell
                className="mt-0.5 size-3.5 shrink-0 text-accent"
                strokeWidth={2}
                aria-hidden
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium leading-snug text-foreground">
                {title}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted">{body}</p>
              {!isBlocked ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onEnable()}
                  className="mt-2 inline-flex min-h-8 items-center rounded-[8px] border border-[color-mix(in_oklch,var(--accent)_50%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] px-2.5 text-[10px] font-semibold text-accent transition-[opacity,background] duration-150 hover:bg-[color-mix(in_oklch,var(--accent)_22%,transparent)] disabled:opacity-50"
                >
                  {busy ? "Enabling…" : "Enable notifications"}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={onDismiss}
              className="grid size-7 shrink-0 place-items-center rounded-full text-muted transition-[color,background] duration-150 hover:bg-[color-mix(in_oklch,var(--fg)_8%,transparent)] hover:text-foreground"
            >
              <X className="size-3.5" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
