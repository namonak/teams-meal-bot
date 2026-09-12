# Team Meal Bot

`밥부장`은 Teams 단체 대화방에서 식사 참여와 메뉴를 취합하는 봇입니다.

## 서버 배포

1. `cp .env.example .env` 후 Microsoft 앱 값을 채웁니다.
2. 기존 HTTPS 프록시에서 `meal-bot.joannes.kr`의 `/api/messages`와 `/healthz`를 `127.0.0.1:3978`로 전달합니다.
3. `docker compose up -d --build`를 실행합니다.
4. `curl https://meal-bot.joannes.kr/healthz`가 `{"ok":true}`를 반환하는지 확인합니다.

## Teams 등록

Teams Developer CLI로 앱 등록 시 endpoint를 `https://meal-bot.joannes.kr/api/messages`로 지정합니다. `appPackage/manifest.json`의 `{{MICROSOFT_APP_ID}}`를 생성된 앱 ID로 바꾸고, manifest와 PNG 아이콘 두 개를 ZIP으로 묶어 대상 단체 대화방에 사용자 지정 앱으로 추가합니다.
