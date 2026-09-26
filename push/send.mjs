// 본초 도장 저녁 알림 — 텔레그램·클라우드 루틴 없이 이것 하나로 끝.
// 앱이 Apps Script 에 올려 둔 코치 지표(snapshot)를 읽어 문구를 고르고, 앱에 등록된 구독자에게 웹 푸시.
//   20:00 KST 실행: 매일 1통
//   22:30 KST 실행(LATE): 오늘 한 문제도 안 풀었을 때만 1통 더
import webpush from 'web-push';

const base = process.env.COACH_URL;                    // …/exec?secret=…
webpush.setVapidDetails('https://reversecompany.github.io/boncho-dojang/', process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

let subs = JSON.parse(process.env.SUBSCRIPTIONS || '[]');
try { subs = subs.concat(await (await fetch(base + '&action=subs')).json()); } catch (e) { console.log('subs fetch fail', e.message); }
subs = subs.filter((s, i, a) => a.findIndex(t => t.endpoint === s.endpoint) === i);

const kst = new Date(Date.now() + 9 * 3600e3);
const today = kst.toISOString().slice(0, 10);
const late = kst.getUTCHours() >= 22;
const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const seed = [...today].reduce((a, c) => a + c.charCodeAt(0), 0);
const pick = arr => arr[seed % arr.length];

let title = '약동이', body = process.env.FORCE_TEXT || '';
if (!body) {
  const props = await (await fetch(base)).json();
  let s = {};
  try { s = JSON.parse(props.snapshot || '{}'); } catch (_) {}
  const fresh = s.today === today;
  const xp = fresh ? (s.todayXp || 0) : 0;
  const goal = s.goal || 60;
  const since = s.lastStudyDay ? days(s.lastStudyDay, today) : 99;
  const due = s.dueToday || 0;
  const dd = s.dday;
  const near = s.xpToNextRank && s.xpToNextRank <= 150 && s.nextRank;
  if (s.rank) title = `약동이 · ${s.rank}`;
  console.log('snap', { today: s.today, fresh, xp, goal, since, due, dd, rank: s.rank, next: s.xpToNextRank });

  if (late && xp > 0) { console.log('22:30 — 오늘 이미 공부함, 안 보냄'); process.exit(0); }

  if (late) body = pick([
    `오늘 아직 0 XP예요. 자기 전에 한 판만 — ${s.streak ? s.streak + '일 연속이 걸려 있어요.' : '5분이면 끝나요.'}`,
    `하루 마감 1시간 반 전. 재시험 한 판이면 오늘도 도장 쾅.`,
  ]);
  else if (since >= 2) body = pick([
    `${since}일째 쉬는 중… 약재들이 조용히 잊혀지고 있어요. ${dd != null ? 'D-' + dd + ', ' : ''}딱 한 판만.`,
    `${since}일 만에 돌아오면 약동이가 제일 기뻐해요. 재시험 한 판부터 가볍게.`,
  ]);
  else if (near && xp < goal) body = `${s.nextRank}까지 ${s.xpToNextRank} XP! 오늘 한 판이면 진화합니다.`;
  else if (xp === 0 && due > 0) body = pick([
    `재시험 ${due}개가 기다려요. 오늘 뱉으면 "외움"으로 올라가요 — 5분 컷.`,
    `어제 넣은 ${due}개, 오늘 안 꺼내면 다시 흐려져요. 한 판만!`,
    `${due}개만 뱉으면 목차 점수가 바로 올라요. 지금이 딱 좋은 타이밍.`,
  ]);
  else if (xp === 0) body = pick([
    `오늘 한 판 아직이에요. ${s.nextRank ? s.nextRank + '까지 ' + s.xpToNextRank + ' XP — ' : ''}묶음 하나면 80 XP.`,
    `${dd != null ? '중간고사 D-' + dd + '. ' : ''}새 묶음 하나만 넣고 자요.`,
  ]);
  else if (xp < goal) body = `오늘 ${xp} XP! 목표까지 ${goal - xp} XP만 더 — 재시험 한 판이면 채워요.`;
  else if (due > 0) body = `오늘 ${xp} XP 👏 남은 재시험 ${due}개만 뱉으면 완벽한 하루.`;
  else body = pick([
    `오늘 목표 달성 🔥 ${s.streak || 1}일 연속. ${s.nextRank ? s.nextRank + '까지 ' + s.xpToNextRank + ' XP.' : ''}`,
    `오늘 ${xp} XP, 완벽해요. 내일 재시험이 오늘 걸 "외움"으로 바꿔 줄 거예요.`,
  ]);
  if (dd != null && dd <= 14 && !late) body += ` (시험 D-${dd})`;
}

let ok = 0;
for (const sub of subs) {
  const who = (sub.name || '?') + ' ' + new URL(sub.endpoint).host;
  try {
    const r = await webpush.sendNotification(sub, JSON.stringify({ title, body }), { TTL: 4 * 3600, urgency: 'high' });
    console.log('OK ', who, r.statusCode); ok++;
  } catch (e) {
    console.log('ERR', who, e.statusCode, e.statusCode === 404 || e.statusCode === 410 ? '(구독 만료 — 앱 기록 탭에서 알림 다시 켜기)' : e.body);
  }
}
console.log(`${ok}/${subs.length} sent — ${title}: ${body}`);
if (subs.length && !ok) process.exit(1);
