// This is the "Offline page" service worker

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "pwabuilder-page";

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = "offline.html";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(offlineFallbackPage))
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;

        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {

        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});





self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncDataToServer());
  }
});

async function syncDataToServer() {
  // هنا ترسل بيانات مخزنة مسبقًا إلى الخادم
  console.log('⏳ Syncing data to server...');
  // مثال تجريبي فقط:
  await fetch('/sync-endpoint', {
    method: 'POST',
    body: JSON.stringify({ message: 'synced' }),
    headers: { 'Content-Type': 'application/json' }
  });
}










self.addEventListener('periodicsync', event => {
  if (event.tag === 'get-latest-content') {
    event.waitUntil(fetchAndCacheContent());
  }
});

async function fetchAndCacheContent() {
  console.log('🔁 Periodic Sync fetching new content...');
  const response = await fetch('/');
  const data = await response.text();
  const cache = await caches.open('pwabuilder-page');
  await cache.put('/', new Response(data));
}




















self.addEventListener('push', event => {
  const data = event.data ? event.data.text() : 'No payload';
  const options = {
    body: data,
    icon: '/icons/icon.png',
    badge: '/icons/icon.png'
  };

  event.waitUntil(
    self.registration.showNotification('📣 Push Notification', options)
  );
});
