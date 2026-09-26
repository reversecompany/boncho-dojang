// 본초 도장 런처 서비스워커 — 푸시 알림만 담당한다.
// 알림 문구는 GitHub Actions(push/send.mjs)가 코치 봇이 오늘 보낸 메시지를 실어서 보낸다.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || '약동이', {
    body: d.body || '오늘 재시험이 기다리고 있어요. 한 판만 하고 가요!',
    icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'boncho-daily',
    data: { url: './?from=push' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) { c.navigate && c.navigate('./?from=push'); return c.focus(); } }
    return self.clients.openWindow('./?from=push');
  }));
});
