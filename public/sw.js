/* RABT PWA service worker — Web Push + notification deep-link
 * Cache-bust: v7 — admin broadcast kind (tag + /discover default).
 */

function toAbsoluteUrl(url) {
  if (!url) return self.location.origin + "/meetups";
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : "/" + url;
  return self.location.origin + path;
}

const NOTIFY_ICON = toAbsoluteUrl("/icons/notify-icon-192.png");
const NOTIFY_BADGE = toAbsoluteUrl("/icons/badge-96x96.png");

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
    kind: undefined,
    broadcastId: undefined,
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
        kind: parsed.kind,
        broadcastId: parsed.broadcastId,
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

  const isBroadcast = data.kind === "broadcast";
  const relativeOrAbs =
    data.url ||
    (isBroadcast
      ? "/discover"
      : data.meetupId
        ? "/meetups?chat=" + encodeURIComponent(data.meetupId)
        : "/meetups");
  const url = toAbsoluteUrl(relativeOrAbs);
  // Unique tag — broadcast vs meetup chat; never collapse consecutive pushes.
  const tag = isBroadcast
    ? "rabt-broadcast-" + (data.broadcastId || Date.now())
    : "rabt-chat-" +
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
            kind: data.kind,
            broadcastId: data.broadcastId,
            title: data.title,
            body: data.body,
            url,
          });
        } catch {
          /* ignore */
        }
      }

      const payload = {
        url,
        meetupId: data.meetupId,
        messageId: data.messageId,
        kind: data.kind,
        broadcastId: data.broadcastId,
      };
      const title = data.title || "RABT";
      const body = data.body || (isBroadcast ? "Announcement" : "New message");

      // Always show OS tray on push (reliability). Fail open: retry without
      // icon/badge if asset URLs break showNotification on some Android.
      try {
        await self.registration.showNotification(title, {
          body,
          icon: NOTIFY_ICON,
          badge: NOTIFY_BADGE,
          tag,
          renotify: true,
          requireInteraction: false,
          data: payload,
        });
      } catch (err) {
        console.info("[sw] showNotification with icons failed, retry plain", err);
        try {
          await self.registration.showNotification(title, {
            body,
            tag,
            renotify: true,
            requireInteraction: false,
            data: payload,
          });
        } catch (err2) {
          console.info("[sw] showNotification plain soft-fail", err2);
        }
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const payload = event.notification.data || {};
  const isBroadcast = payload.kind === "broadcast";
  const targetRaw =
    payload.url ||
    (isBroadcast
      ? "/discover"
      : payload.meetupId
        ? "/meetups?chat=" + encodeURIComponent(payload.meetupId)
        : "/meetups");
  const absoluteUrl = toAbsoluteUrl(targetRaw);

  let meetupId = payload.meetupId;
  if (!meetupId && !isBroadcast) {
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
        if (meetupId && !isBroadcast) {
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
