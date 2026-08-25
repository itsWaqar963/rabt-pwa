/* RABT PWA service worker — Web Push + notification deep-link
 * Cache-bust: v3 — always show OS tray on push unless a VISIBLE focused client exists.
 */

function toAbsoluteUrl(url) {
  if (!url) return self.location.origin + "/meetups";
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : "/" + url;
  return self.location.origin + path;
}

/** Only suppress tray when a client is both focused AND visible (not minimized/background). */
function isClientActivelyVisible(client) {
  if (!client || !client.focused) return false;
  // WindowClient.visibilityState: 'visible' | 'hidden' | 'prerender'
  // Minimized / backgrounded windows report 'hidden' even if focused was sticky.
  if (typeof client.visibilityState === "string") {
    return client.visibilityState === "visible";
  }
  // Older browsers without visibilityState — do NOT suppress (fail open → show tray).
  return false;
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
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = {
        title: parsed.title || "RABT",
        body: parsed.body || "",
        url: parsed.url,
        meetupId: parsed.meetupId,
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
  const tag = data.meetupId ? "rabt-chat-" + data.meetupId : "rabt-chat";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      let activelyViewing = false;
      for (const client of allClients) {
        try {
          client.postMessage({
            type: "RABT_PUSH_MESSAGE",
            meetupId: data.meetupId,
            title: data.title,
            body: data.body,
            url,
          });
        } catch {
          /* ignore */
        }
        if (isClientActivelyVisible(client)) {
          activelyViewing = true;
        }
      }

      // Fail OPEN: minimized / background / closed → always show OS tray.
      // Only skip when a visible+focused client can show in-app toast instead.
      if (activelyViewing) return;

      await self.registration.showNotification(data.title || "RABT", {
        body: data.body || "New message",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        tag,
        renotify: true,
        requireInteraction: false,
        data: { url, meetupId: data.meetupId },
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
