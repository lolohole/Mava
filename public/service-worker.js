const CACHE_NAME = 'mava-cache-v1';
const urlsToCache = [
  '/',
  '/styles.css', // إن كنت تستخدم CSS
  '/script.js',  // إن كنت تستخدم جافاسكريبت خارجي
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
