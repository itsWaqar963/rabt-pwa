import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const SUB_STORAGE_KEY = "rabt_push_subscription";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function isVapidPublicConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim());
}

/** True when PushManager already has an active subscription. */
export async function hasPushSubscription(
  registration?: ServiceWorkerRegistration | null,
): Promise<boolean> {
  try {
    const reg =
      registration ??
      (typeof navigator !== "undefined" && "serviceWorker" in navigator
        ? await navigator.serviceWorker.ready
        : null);
    if (!reg?.pushManager) return false;
    const sub = await reg.pushManager.getSubscription();
    return Boolean(sub?.endpoint);
  } catch {
    return false;
  }
}

/**
 * Subscribe via PushManager and POST subscription to /api/push-subscribe.
 * Returns true when a PushSubscription exists (created or reused).
 */
export async function registerPushSubscription(
  registration: ServiceWorkerRegistration,
): Promise<boolean> {
  if (!registration.pushManager) return false;
  if (typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!vapid) return false;

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

    if (!isSupabaseConfigured) return Boolean(json.endpoint);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token || !json.endpoint) return Boolean(json.endpoint);

    const res = await fetch("/api/push-subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription: json }),
    });

    if (!res.ok) {
      console.info("[pwa] push-subscribe API soft-fail", res.status);
    }

    return Boolean(json.endpoint);
  } catch (err) {
    console.info("[pwa] push subscribe soft-fail", err);
    return false;
  }
}

/**
 * Fire-and-forget notify after a successful meetup chat send.
 */
export async function notifyMeetupMessagePush(opts: {
  meetupId: string;
  title: string;
  body: string;
  url?: string;
  messageId?: string;
}): Promise<void> {
  if (!isVapidPublicConfigured() || !isSupabaseConfigured) return;

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    void fetch("/api/notify-meetup-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        meetupId: opts.meetupId,
        title: opts.title,
        body: opts.body,
        url: opts.url ?? `/meetups?chat=${encodeURIComponent(opts.meetupId)}`,
        messageId: opts.messageId,
      }),
    })
      .then((res) => {
        if (!res.ok && process.env.NODE_ENV === "development") {
          console.info("[push] notify soft-fail", res.status);
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.info("[push] notify soft-fail", err);
        }
      });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.info("[push] notify soft-fail", err);
    }
  }
}
