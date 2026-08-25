/**
 * OS-level notification when the PWA / tab is backgrounded.
 * Prefer ServiceWorkerRegistration.showNotification — works when the page is
 * throttled/hidden; `new Notification()` is often blocked in background tabs.
 */

export function canShowOsNotification(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof Notification === "undefined") return false;
  return Notification.permission === "granted";
}

export async function closeOsChatNotifications(meetupId: string): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const notes = await reg.getNotifications({
      tag: `rabt-chat-${meetupId}`,
    });
    for (const n of notes) n.close();
  } catch {
    /* soft-fail */
  }
}

export function showOsChatNotification(opts: {
  title: string;
  body: string;
  meetupId: string;
}): void {
  if (!canShowOsNotification()) return;

  const url = `/meetups?chat=${encodeURIComponent(opts.meetupId)}`;
  const title = opts.title || "RABT";
  const options: NotificationOptions = {
    body: opts.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: `rabt-chat-${opts.meetupId}`,
    data: { meetupId: opts.meetupId, url },
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
