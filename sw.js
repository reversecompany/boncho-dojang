// 본초 도장 서비스워커 — 오프라인 캐시 + 웹 푸시.
// 알림 문구는 GitHub Actions(push/send.mjs)가 그날 코치 봇 메시지를 실어 보낸다.
const CACHE = 'boncho-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'manifest.json', 'icons/icon-192.png']))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;       // 서버(Apps Script)·폰트는 건드리지 않음
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./'))));  // 네트워크 우선 — 업데이트 바로 반영, 끊기면 캐시
});
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || '약동이', {
    body: d.body || '오늘 재시험이 기다리고 있어요. 한 판만 하고 가요!',
    icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'boncho-daily', data: { url: './?from=push' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./?from=push');
  }));
});
