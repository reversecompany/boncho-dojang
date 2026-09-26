# 본초 도장 — 홈 화면 앱 + 알림

https://reversecompany.github.io/boncho-dojang/ (게임 본체는 claude.ai 아티팩트, 이건 런처)

- 홈 화면 아이콘(약동이) + `sw.js` 웹 푸시.
- 매일 20:25 / 22:15 KST `daily.yml`이 Apps Script 상태 URL(`COACH_URL` secret)을 읽어,
  오늘 코치 봇이 텔레그램으로 보낸 잔소리(`lastNote`)를 같은 문구로 푸시한다. 오늘 보낸 게 없으면 안 보냄.
- 알림 코드 등록: `python3 add_sub.py 이름 'BONCHO:...'`
- 수동 테스트: `gh workflow run daily.yml -R reversecompany/boncho-dojang -f text='테스트'`
- VAPID 원본 `vapid.local.json`, 구독 목록 `subs.local.json` (둘 다 gitignore).
