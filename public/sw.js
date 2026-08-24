/* RABT PWA service worker — Web Push + notification deep-link foundation */

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "RABT", body: "New activity", url: undefined, meetupId: undefined };
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

  const url =
    data.url ||
    (data.meetupId ? `/meetups?chat=${encodeURIComponent(data.meetupId)}` : "/meetups");

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { url, meetupId: data.meetupId },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const payload = event.notification.data || {};
  const targetUrl =
    payload.url ||
    (payload.meetupId
      ? `/meetups?chat=${encodeURIComponent(payload.meetupId)}`
      : "/meetups");

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client && typeof client.navigate === "function") {
            try {
              await client.navigate(targetUrl);
            } catch {
              /* navigate may fail on older browsers */
            }
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
