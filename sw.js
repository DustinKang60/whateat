// 오늘 뭐 먹지? — Service Worker
const CACHE_NAME = 'whateat-v2';
const ASSETS = [
  '/whateat/',
  '/whateat/index.html',
  '/whateat/manifest.json',
  '/whateat/icons/icon-192x192.png',
  '/whateat/icons/icon-512x512.png',
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 구버전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리: Cache First (앱 파일) / Network First (API)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 외부 API는 네트워크 우선
  if (url.hostname !== self.location.hostname) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // 앱 파일은 캐시 우선
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
