// Yield IT Platform — Service Worker
// Handles web push notifications for network outage alerts

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Network Alert", body: event.data.text(), icon: "/favicon.ico" };
  }

  const title   = payload.title ?? "Yield — Network Alert";
  const options = {
    body:    payload.body   ?? "A network device requires attention.",
    icon:    payload.icon   ?? "/favicon.ico",
    badge:   payload.badge  ?? "/favicon.ico",
    tag:     payload.tag    ?? "network-alert",
    data:    { url: payload.url ?? "/network" },
    actions: [{ action: "view", title: "View Network Status" }],
    requireInteraction: payload.requireInteraction ?? false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/network";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Otherwise open new tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
