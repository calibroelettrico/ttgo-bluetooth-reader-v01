const CACHE_NAME = 'ttgo-reader-v2'; // Versione incrementata per forzare l'aggiornamento
const APP_SHELL_URLS = [
  './',
  './index.html',
  './manifest.json'
];

// Evento di installazione: mette in cache solo l'app shell locale.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
  );
});

// Evento di fetch: serve dalla cache, altrimenti va in rete e poi mette in cache.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se la risorsa è in cache, la restituisce
        if (response) {
          return response;
        }

        // Altrimenti, prova a recuperarla dalla rete
        return fetch(event.request).then(
          networkResponse => {
            // Controlla se abbiamo ricevuto una risposta valida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }

            // Clona la risposta perché deve essere usata sia dal browser che dalla cache
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          console.log('Fetch failed; user is offline and resource is not in cache.', error);
          // Non restituisce nulla, quindi il browser mostrerà la sua pagina offline
        });
      })
  );
});

// Evento di attivazione: pulisce le vecchie cache non più necessarie
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
