self.addEventListener('install', function(event) {
  console.log('Service Worker installing.');
  // يمكنك وضع أكواد التخزين المؤقت هنا
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
