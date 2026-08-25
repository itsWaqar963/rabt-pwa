"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { registerPushSubscription } from "@/lib/push-subscribe";

/**
 * Registers `/sw.js`, requests notification permission when authenticated,
 * and posts Web Push subscription to the server when VAPID public key is set.
 * Re-syncs on login, visibility, and focus (critical for mobile PWA).
 */
export function ServiceWorkerRegister() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    async function syncPush() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;

        try {
          await registration.update();
        } catch {
          /* soft-fail */
        }

        if (!user?.id) return;
        if (typeof Notification === "undefined") return;

        if (Notification.permission === "default") {
          try {
            await Notification.requestPermission();
          } catch {
            /* soft-fail */
          }
        }

        if (cancelled) return;
        if (Notification.permission !== "granted") {
          console.info("[pwa] notification permission not granted");
          return;
        }

        await registerPushSubscription(registration);
      } catch (err) {
        console.info("[pwa] sw register soft-fail", err);
      }
    }

    void syncPush();

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!user?.id) return;
      void navigator.serviceWorker.ready
        .then((reg) => registerPushSubscription(reg))
        .catch((err) => {
          console.info("[pwa] push re-sync soft-fail", err);
        });
    };

    const onFocus = () => {
      if (!user?.id) return;
      void navigator.serviceWorker.ready
        .then((reg) => registerPushSubscription(reg))
        .catch(() => {
          /* soft-fail */
        });
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [user?.id]);

  return null;
}
