/* Cache-first apenas para os estáticos do app.
 * API, allauth e mídia sempre vão para a rede.
 */
const CACHE = 'treino-static-v16';
const SCOPE = new URL('./', self.location.href).pathname;
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // cache: 'reload' ignora o cache do SW antigo durante a atualização,
      // senão o addAll pode re-cachear a versão velha dos arquivos
      .then((cache) => Promise.all(ASSETS.map((a) => cache.add(new Request(a, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SCOPE)) return;
  if (/\/(api|allauth|media)\//.test(url.pathname)) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        const shell = await caches.match(SCOPE + 'index.html') || await caches.match('./');
        if (shell) return shell;
      }
      return new Response('Sem conexão', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
