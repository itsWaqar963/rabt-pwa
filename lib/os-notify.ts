/**
 * OS-level notification when the PWA / tab is backgrounded.
 * Prefer ServiceWorkerRegistration.showNotification — works when the page is
 * throttled/hidden; `new Notification()` is often blocked in background tabs.
 */

const NOTIFY_ICON = "/icons/notify-icon-192.png?v=5";
const NOTIFY_BADGE = "/icons/badge-96x96.png?v=5";

export function canShowOsNotification(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof Notification === "undefined") return false;
  return Notification.permission === "granted";
}

/** Close all tray notes for a meetup (unique tags — match via data.meetupId). */
export async function closeOsChatNotifications(meetupId: string): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const notes = await reg.getNotifications();
    for (const n of notes) {
      const data = n.data as { meetupId?: string } | undefined;
      if (data?.meetupId === meetupId) n.close();
      else if (n.tag === `rabt-chat-${meetupId}`) n.close();
    }
  } catch {
    /* soft-fail */
  }
}

export function showOsChatNotification(opts: {
  title: string;
  body: string;
  meetupId: string;
  messageId?: string;
}): void {
  if (!canShowOsNotification()) return;

  const url = `/meetups?chat=${encodeURIComponent(opts.meetupId)}`;
  const title = opts.title || "RABT";
  const tag =
    opts.messageId != null && opts.messageId !== ""
      ? `rabt-chat-${opts.messageId}`
      : `rabt-chat-${opts.meetupId}-${Date.now()}`;
  const options: NotificationOptions = {
    body: opts.body,
    icon: NOTIFY_ICON,
    badge: NOTIFY_BADGE,
    tag,
    data: { meetupId: opts.meetupId, url, messageId: opts.messageId },
  };

  void (async () => {
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, options);
        return;
      }
    } catch (err) {
      console.info("[os-notify] sw showNotification soft-fail", err);
    }

    try {
      const notification = new Notification(title, options);
      notification.onclick = () => {
        try {
          window.focus();
        } catch {
          /* ignore */
        }
        try {
          notification.close();
        } catch {
          /* ignore */
        }
        try {
          if (window.location.pathname + window.location.search !== url) {
            window.location.assign(url);
          }
        } catch {
          /* ignore */
        }
      };
    } catch (err) {
      console.info("[os-notify] Notification soft-fail", err);
    }
  })();
}
