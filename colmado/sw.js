// Colmado — offline shell.
// The whole app is one file, so caching it is the whole job. Network-first for
// the page (so a redeploy is picked up), cache-first for everything else.
const CACHE = 'colmado-3074784588';
const SHELL = ['./', './?app=1', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // cache:'reload' bypasses the browser's HTTP cache. Without it a redeploy can
  // be installed into a fresh cache *as the old page* — the app silently never
  // updates on a phone that already has it.
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const esPagina = e.request.mode === 'navigate';
  e.respondWith(
    esPagina
      ? fetch(new Request(e.request, { cache: 'reload' }))
          .then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
          .catch(() => caches.match(e.request).then(r => r || caches.match('./?app=1')))
      : caches.match(e.request).then(r => r || fetch(e.request))
  );
});
