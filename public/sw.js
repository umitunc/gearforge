/**
 * GearForge 3D — Service Worker (Trunçgil Teknoloji © 2026)
 * Çevrimdışı (Offline-First) Parametrik CAD Motoru ve Varlık Önbellekleme
 */

const CACHE_NAME = 'gearforge-v1.0.8';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './gearforge-isometric-icon_no_bg.png',
  './gearforge-preloader-64.webp',
  './pwa-64x64.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png',
  './apple-touch-icon.png',
];

// 1. Kurulum (Install) — Kritik varlıkları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        // Toleranslı önbellekleme: Tek bir dosya 404 olsa dahi kurulum başarısız olmaz
        for (const asset of PRECACHE_ASSETS) {
          try {
            await cache.add(asset);
          } catch (err) {
            console.warn('[GearForge SW] Ön-önbellek uyarısı (' + asset + '):', err);
          }
        }
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Etkinleştirme (Activate) — Eski sürümleri temizle ve istemcileri devral
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('gearforge-') && key !== CACHE_NAME)
            .map((oldKey) => {
              console.log('[GearForge SW] Eski önbellek temizlendi:', oldKey);
              return caches.delete(oldKey);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. İstekleri Yakalama (Fetch) — Stale-While-Revalidate & Offline Destek
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Yalnızca GET isteklerini ele al
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Tarayıcı eklentileri (chrome-extension vb.) ve harici API'leri hariç tut
  if (url.origin !== self.location.origin) return;

  // Sayfa yönlendirmeleri (HTML navigasyonu) -> Network-First (Offline Fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('./index.html').then((res) => res || caches.match('./'));
        })
    );
    return;
  }

  // Statik varlıklar (JS, CSS, Resimler, Fontlar) -> Cache-First with Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Arka planda sessizce güncelle (stale-while-revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cloned = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
            }
          })
          .catch(() => {
            /* Çevrimdışıyken hata vermeden sessizce geç */
          });

        return cachedResponse;
      }

      // Önbellekte yoksa ağdan getir ve önbelleğe ekle
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return networkResponse;
        })
        .catch((err) => {
          // Çevrimdışıyken ve önbellekte yoksa
          console.warn('[GearForge SW] Kaynak alınamadı ve önbellekte yok:', request.url);
          throw err;
        });
    })
  );
});

// 4. Güncelleme Mesajlarını Dinle (SKIP_WAITING)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
