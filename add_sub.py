#!/usr/bin/env python3
"""본초 도장 앱에서 복사한 '알림 코드'를 등록한다.
사용: python3 add_sub.py 이름 'BONCHO:....'
구독 목록은 subs.local.json(깃에 안 올라감)에 쌓고, 통째로 GitHub secret SUBSCRIPTIONS 에 덮어쓴다."""
import sys, json, base64, subprocess, os
here = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(here, 'subs.local.json')
name, code = sys.argv[1], sys.argv[2].strip()
code = code[code.index('BONCHO:') + 7:].split()[0]
sub = json.loads(base64.b64decode(code + '=' * (-len(code) % 4)).decode('utf-8'))
sub['name'] = name
subs = json.load(open(path)) if os.path.exists(path) else []
subs = [s for s in subs if s.get('name') != name and s['endpoint'] != sub['endpoint']] + [sub]
json.dump(subs, open(path, 'w'), ensure_ascii=False, indent=1)
subprocess.run(['gh', 'secret', 'set', 'SUBSCRIPTIONS', '-R', 'reversecompany/boncho-dojang'], input=json.dumps(subs), text=True, check=True)
print(f'등록 완료: {name} (총 {len(subs)}개 기기)')
