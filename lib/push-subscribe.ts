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

/**
 * Subscribe via PushManager and POST subscription to /api/push-subscribe.
 */
export async function registerPushSubscription(
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

    if (!isSupabaseConfigured) return;

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token || !json.endpoint) return;

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
  } catch (err) {
    console.info("[pwa] push subscribe soft-fail", err);
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
      }),
    }).catch(() => {
      /* fire-and-forget */
    });
  } catch {
    /* soft-fail */
  }
}
