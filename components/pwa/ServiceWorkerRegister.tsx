"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const SUB_STORAGE_KEY = "rabt_push_subscription";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function ensurePushSubscription(
  registration: ServiceWorkerRegistration,
): Promise<void> {
  if (!registration.pushManager) return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!vapid) return;

  try {
    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
    }
    const json = sub.toJSON();
    try {
      localStorage.setItem(SUB_STORAGE_KEY, JSON.stringify(json));
    } catch {
      /* quota / private mode */
    }
    console.info("[pwa] push subscription endpoint", json.endpoint);
  } catch (err) {
    console.info("[pwa] push subscribe soft-fail", err);
  }
}

/**
 * Registers `/sw.js`, soft-requests notification permission on first auth,
 * and optionally subscribes to Web Push when VAPID public key is set.
 * True background delivery still needs a server that signs pushes with the
 * matching private key.
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
        await ensurePushSubscription(registration);
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
