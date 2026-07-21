// Self-destroying service worker.
//
// The old PWA registered a cache-first service worker, which served stale
// files to returning visitors on the marketing site. This replacement
// unregisters itself, clears every cache it left behind, and reloads any open
// page once so everyone lands on the current site.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
