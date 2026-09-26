# 본초 도장 (자체 사이트 PWA)

https://reversecompany.github.io/boncho-dojang/

- **index.html은 빌드 산출물.** 원본은 `~/Desktop/학교/본초학2/src/` (bg_*.js + bg_site.js), `./build.sh`가 여기로 쓴다.
- 서버 = Google Apps Script "본초도장 감시견"(`~/클로드코드/본초도장_코치/coach.gs`):
  POST save(진도 gzip+base64 · 코치 지표 snap) / GET load / POST sub(웹푸시 구독).
  동기화 코드(APP_KEY)는 공개 코드에 없음 — 앱 기록 탭에 한 번 입력하거나 `/#k=코드`로 열기.
- 코치: 19:45 이후 Apps Script가 `[본초앱] DATA` 메일(snap) → 20:00 클라우드 루틴이 읽고 잔소리 → 텔레그램.
- 푸시: `daily.yml`(20:25·22:15 KST)이 Apps Script에서 구독 목록(action=subs)과 오늘 보낸 문구(lastNote)를 읽어 발송.
- 수동 테스트: `gh workflow run daily.yml -R reversecompany/boncho-dojang -f text='테스트'`
