# Team Meal Bot

`밥부장`은 Teams 단체 대화방에서 식사 참여와 메뉴를 취합하는 봇입니다.

## 기능

- 평일 KST 11:15에 점심, 17:45에 저녁 설문을 자동 게시합니다.
- 참여 / 따로 먹음 / 미정과 희망 메뉴를 Adaptive Card로 받습니다.
- 응답할 때마다 원래 카드의 참여자와 메뉴 집계를 갱신합니다.
- 점심은 14:00, 저녁은 20:00에 마감되어 최종 집계만 남습니다.
- 봇을 최초 설치한 단체 대화방 한 곳에서만 동작합니다.

## 대화방 명령

| 입력 | 동작 |
| --- | --- |
| `@밥부장` | 사용법 표시 |
| `@밥부장 현황` | 오늘 점심·저녁 일정 표시 |
| `@밥부장 설정 점심 11:30` | 점심 설문 시각 변경 |
| `@밥부장 설정 저녁 18:00` | 저녁 설문 시각 변경 |

활성 단체 대화방의 모든 구성원이 설문 시각을 변경할 수 있으며, 변경 이력은 SQLite에 저장됩니다.

## 서버 배포

1. `cp .env.example .env` 후 Microsoft 앱 값을 채웁니다. `.env`는 절대 커밋하지 않습니다.

   | 변수 | 값 |
   | --- | --- |
   | `MicrosoftAppId` | Teams 앱 등록 시 발급된 앱 ID |
   | `MicrosoftAppPassword` | 앱 클라이언트 비밀값 |
   | `MicrosoftAppTenantId` | Microsoft 365 테넌트 ID |
   | `PUBLIC_BASE_URL` | `https://meal-bot.joannes.kr` |
   | `DATABASE_PATH` | Docker에서는 `/data/team-meal-bot.sqlite` |
2. 기존 HTTPS 프록시에서 `meal-bot.joannes.kr`의 `/api/messages`와 `/healthz`를 `127.0.0.1:3978`로 전달합니다.
3. `docker compose up -d --build`를 실행합니다.
4. `curl https://meal-bot.joannes.kr/healthz`가 `{"ok":true}`를 반환하는지 확인합니다.

Nginx 예시는 다음과 같습니다.

```nginx
location / {
  proxy_pass http://127.0.0.1:3978;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

부팅 시 자동 실행하려면 서버의 경로에 맞춰 `deploy/team-meal-bot.service`의 `WorkingDirectory`를 수정한 뒤 다음을 실행합니다.

```bash
sudo cp deploy/team-meal-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now team-meal-bot
sudo systemctl status team-meal-bot
```

## Teams 등록

Teams Developer CLI로 앱 등록 시 endpoint를 `https://meal-bot.joannes.kr/api/messages`로 지정합니다. `appPackage/manifest.json`의 `{{MICROSOFT_APP_ID}}`를 생성된 앱 ID로 바꾸고, manifest와 PNG 아이콘 두 개를 ZIP으로 묶어 대상 단체 대화방에 사용자 지정 앱으로 추가합니다.

```bash
cd appPackage
zip -r ../team-meal-bot.zip manifest.json color.png outline.png
```

앱을 추가한 뒤 `@밥부장`을 보내 사용법이 보이면 설치가 완료된 것입니다. 실제 계정/테넌트 비밀값은 이 저장소에 넣지 않습니다.

## 확인 목록

1. `https://meal-bot.joannes.kr/healthz`가 `{"ok":true}`를 반환한다.
2. 대상 단체 대화방에 앱을 추가한다.
3. `@밥부장`으로 도움말이 보이는지 확인한다.
4. `@밥부장 설정 점심 11:30`으로 일정 변경이 반영되는지 확인한다.
5. 테스트 시각을 설정해 설문 카드·응답·집계 갱신을 확인한다.
