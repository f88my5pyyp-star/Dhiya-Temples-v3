/* ==========================================================
   MY BUILDTRACK - SERVICE WORKER
   Cache Name: my-buildtrack-v1
   ========================================================== */

const CACHE_NAME = 'my-buildtrack-v1';

// Static assets to pre-cache for offline capability
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './site.webmanifest',
  './logo.svg',
  './icon-192.png',
  './icon-512.png'
];

// CDN scripts used by My BuildTrack to cache on first request
const EXTERNAL_LIBRARIES = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@4.0.3/dist/tesseract.min.js'
];

// 1. INSTALL EVENT: Pre-cache core app shell assets
self.addEventListener('install', (event) => {
  console.log('[My BuildTrack SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[My BuildTrack SW] Pre-caching app shell & assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE EVENT: Clean up outdated caches
self.addEventListener('activate', (event) => {
  console.log('[My BuildTrack SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[My BuildTrack SW] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH EVENT: Stale-While-Revalidate strategy for seamless offline availability
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests (e.g. POST, PUT)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Fetch fresh copy in the background
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // If valid response, update the cache
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[My BuildTrack SW] Network fetch failed, relying on cache:', err);
        });

        // Return cached version immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});
