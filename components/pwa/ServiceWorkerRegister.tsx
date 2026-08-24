"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { registerPushSubscription } from "@/lib/push-subscribe";

/**
 * Registers `/sw.js`, soft-requests notification permission on first auth,
 * and posts Web Push subscription to the server when VAPID public key is set.
 */
export function ServiceWorkerRegister() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    void (async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        if (cancelled) return;

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
        await registerPushSubscription(registration);
      } catch (err) {
        console.info("[pwa] sw register soft-fail", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return null;
}
