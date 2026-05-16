const CACHE_NAME = 'dark-trading-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Use NetworkFirst for HTML files to avoid stale white/black screens
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Use CacheFirst with Network fallback for other assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'DARK TRADING ALERT',
    body: 'New market activity detected.'
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.log('Push data is not JSON, using default');
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png',
    vibrate: [200, 100, 200],
    tag: 'active-signal',
    renotify: true,
    data: {
      url: self.registration.scope
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
