const SHELL_CACHE = 'matrix-studio-shell-v7';
const RUNTIME_CACHE = 'matrix-studio-python-v7';
const SHELL = ['./', './index.html', './style.css', './script.js', './pro.js', './logo.svg', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![SHELL_CACHE, RUNTIME_CACHE].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isPyodide = url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/pyodide/');
  if (isPyodide) {
    event.respondWith(caches.open(RUNTIME_CACHE).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) {
        try { await cache.put(request, response.clone()); } catch (_) {}
      }
      return response;
    }).catch(() => caches.match(request)));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response && response.ok) caches.open(SHELL_CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match('./index.html'))));
  }
});
