// 코치 봇이 오늘 텔레그램으로 보낸 잔소리를 앱 푸시로도 보낸다.
// 출처: Apps Script 상태 URL(lastSent·lastBy·lastNote). 오늘 보낸 게 없으면 아무것도 안 보낸다
// (iOS는 보이지 않는 푸시가 반복되면 구독을 끊으므로 빈 푸시 금지).
// 실행 시각이 두 번(20:25·22:15 KST) — 첫 번은 루틴(cloud)이 보낸 것, 두 번째는 22시 대타(gas-fallback)만.
import webpush from 'web-push';

const subs = JSON.parse(process.env.SUBSCRIPTIONS || '[]');
webpush.setVapidDetails('https://reversecompany.github.io/boncho-dojang/', process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

const kstNow = new Date(Date.now() + 9 * 3600e3);
const today = kstNow.toISOString().slice(0, 10);
const late = kstNow.getUTCHours() >= 22;

let title = '약동이', body = process.env.FORCE_TEXT || '';
if (!body) {
  const st = await (await fetch(process.env.COACH_URL)).json();
  console.log('status', st.lastSent, st.lastBy, (st.lastNote || '').slice(0, 40));
  const want = late ? 'gas-fallback' : 'cloud';
  if (st.lastSent !== today || st.lastBy !== want) { console.log(`오늘(${today}) ${want} 발송 없음 → 푸시 안 함`); process.exit(0); }
  // lastNote 는 앞 120자. 문장 끝에서 자른다.
  let t = (st.lastNote || '').replace(/\s+/g, ' ').trim();
  const cut = Math.max(t.lastIndexOf('. '), t.lastIndexOf('! '), t.lastIndexOf('? '), t.lastIndexOf('요 '), t.lastIndexOf('다 '));
  if (t.length >= 118 && cut > 40) t = t.slice(0, cut + 1) + ' …';
  body = t || '오늘 재시험이 기다리고 있어요. 한 판만 하고 가요!';
}

let ok = 0;
for (const sub of subs) {
  const who = (sub.name || '?') + ' ' + new URL(sub.endpoint).host;
  try {
    const r = await webpush.sendNotification(sub, JSON.stringify({ title, body }), { TTL: 6 * 3600, urgency: 'high' });
    console.log('OK ', who, r.statusCode); ok++;
  } catch (e) {
    console.log('ERR', who, e.statusCode, e.statusCode === 404 || e.statusCode === 410 ? '(구독 만료 — 앱에서 알림 다시 켜기)' : e.body);
  }
}
console.log(`${ok}/${subs.length} sent: ${body}`);
if (subs.length && !ok) process.exit(1);
