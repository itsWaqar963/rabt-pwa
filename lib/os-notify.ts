/**
 * OS-level notification when the PWA / tab is backgrounded.
 * Complements in-app toast (which is invisible when minimized).
 */

export function canShowOsNotification(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof Notification === "undefined") return false;
  return Notification.permission === "granted";
}

export function showOsChatNotification(opts: {
  title: string;
  body: string;
  meetupId: string;
}): void {
  if (!canShowOsNotification()) return;

  try {
    const url = `/meetups?chat=${encodeURIComponent(opts.meetupId)}`;
    const notification = new Notification(opts.title || "RABT", {
      body: opts.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: `rabt-chat-${opts.meetupId}`,
      data: { meetupId: opts.meetupId, url },
    });

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
        const path = `/meetups?chat=${encodeURIComponent(opts.meetupId)}`;
        if (window.location.pathname + window.location.search !== path) {
          window.location.assign(path);
        }
      } catch {
        /* ignore */
      }
    };
  } catch (err) {
    console.info("[os-notify] soft-fail", err);
  }
}
