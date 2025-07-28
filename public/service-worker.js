self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installing...');
  self.skipWaiting(); // فورًا ينشط
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated!');
});

self.addEventListener('fetch', (event) => {
  // تمرير الطلبات مباشرة بدون كاش
  event.respondWith(fetch(event.request));
});
