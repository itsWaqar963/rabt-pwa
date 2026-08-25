/* RABT PWA service worker — Web Push + notification deep-link
 * Cache-bust: v5 — refreshed PWA / notify / badge icons.
 */

const NOTIFY_ICON = "/icons/notify-icon-192.png?v=5";
const NOTIFY_BADGE = "/icons/badge-96x96.png?v=5";

function toAbsoluteUrl(url) {
  if (!url) return self.location.origin + "/meetups";
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : "/" + url;
  return self.location.origin + path;
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "RABT",
    body: "New activity",
    url: undefined,
    meetupId: undefined,
    messageId: undefined,
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = {
        title: parsed.title || "RABT",
        body: parsed.body || "",
        url: parsed.url,
        meetupId: parsed.meetupId,
        messageId: parsed.messageId,
      };
    }
  } catch {
    try {
      const text = event.data && event.data.text();
      if (text) data.body = text;
    } catch {
      /* keep defaults */
    }
  }

  const relativeOrAbs =
    data.url ||
    (data.meetupId
      ? "/meetups?chat=" + encodeURIComponent(data.meetupId)
      : "/meetups");
  const url = toAbsoluteUrl(relativeOrAbs);
  // Unique tag per message — never collapse consecutive pushes for same meetup.
  const tag =
    "rabt-chat-" +
    (data.messageId
      ? data.messageId
      : (data.meetupId || "evt") + "-" + Date.now());

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        try {
          client.postMessage({
            type: "RABT_PUSH_MESSAGE",
            meetupId: data.meetupId,
            messageId: data.messageId,
            title: data.title,
            body: data.body,
            url,
          });
        } catch {
          /* ignore */
        }
      }

      // Always show OS tray on push (reliability). Focused clients get in-app
      // toast via postMessage and may close matching notifications.
      await self.registration.showNotification(data.title || "RABT", {
        body: data.body || "New message",
        icon: NOTIFY_ICON,
        badge: NOTIFY_BADGE,
        tag,
        renotify: true,
        requireInteraction: false,
        data: {
          url,
          meetupId: data.meetupId,
          messageId: data.messageId,
        },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const payload = event.notification.data || {};
  const targetRaw =
    payload.url ||
    (payload.meetupId
      ? "/meetups?chat=" + encodeURIComponent(payload.meetupId)
      : "/meetups");
  const absoluteUrl = toAbsoluteUrl(targetRaw);

  let meetupId = payload.meetupId;
  if (!meetupId) {
    try {
      meetupId = new URL(absoluteUrl).searchParams.get("chat") || undefined;
    } catch {
      meetupId = undefined;
    }
  }

  event.waitUntil(
    (async () => {
      const origin = self.location.origin;
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        const clientUrl = client.url || "";
        if (!clientUrl.startsWith(origin)) continue;
        if (!("focus" in client)) continue;

        await client.focus();
        try {
          client.postMessage({
            type: "RABT_OPEN_CHAT",
            meetupId: meetupId || undefined,
            url: absoluteUrl,
            title: "Meetup",
          });
        } catch {
          /* postMessage may fail on some clients */
        }

        if ("navigate" in client && typeof client.navigate === "function") {
          try {
            await client.navigate(absoluteUrl);
          } catch {
            /* navigate may fail on older browsers */
          }
        }
        return;
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(absoluteUrl);
      }
    })(),
  );
});
