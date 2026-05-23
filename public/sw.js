const CACHE = 'sesviz-v1'

// Cache all app shell assets on install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/', '/manifest.json'])
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  // Remove old caches
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Stale-while-revalidate for navigation and assets; network-only for audio files
self.addEventListener('fetch', (e) => {
  const { request } = e
  // Don't cache cross-origin requests or audio file loads (user files)
  if (request.url.startsWith('blob:') || !request.url.startsWith(self.location.origin)) return

  e.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
        }
        return res
      })
      return cached ?? networkFetch
    })
  )
})
