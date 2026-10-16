// Service Worker - سامانه تقدیرنامه
const CACHE = 'taghdirnameh-v2';

const LOCAL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

const CDN_FILES = [
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(LOCAL_FILES.map(f => cache.add(f).catch(() => {})));
    await Promise.all(CDN_FILES.map(f => cache.add(new Request(f, { mode: 'cors' })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: false });
    if (cached) {
      // به‌روزرسانی در پس‌زمینه
      fetch(req).then(async (res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          (await caches.open(CACHE)).put(req, res.clone());
        }
      }).catch(() => {});
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        (await caches.open(CACHE)).put(req, res.clone());
      }
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
