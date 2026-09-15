# Team Meal Bot

`냠요정`은 Teams 대화방에서 식사 알림과 메뉴 투표를 함께 도와드리는 봇입니다.

## 기능

- 평일 KST 11:15에는 점심, 17:45에는 저녁 설문을 보내드립니다.
- 점심은 `🍽 같이 먹을래요` / `🏃 따밥입니다!` / `🫧 조금 더 고민할게요` 중에서 골라주세요.
- 저녁은 `🍽️ 같이 먹을래요` / `🚪 퇴근입니다!` / `🫧 조금 더 고민할게요` 중에서 골라주세요.
- 어떤 선택을 하셨는지와 참여자 이름을 카드에서 바로 확인하실 수 있습니다.
- 메뉴는 `같이 먹을래요`를 고르신 경우에만 메뉴 픽으로 함께 모아드립니다.
- 응답을 바꾸시면 카드의 인원과 메뉴 집계도 바로 갱신됩니다.
- 점심은 14:00, 저녁은 20:00에 마감되며, 앱을 설치한 대화방마다 따로 동작합니다.
- 알림 시간은 점심 14:00 전, 저녁 20:00 전으로만 설정해 주세요.
- 주말과 2026~2027년 법정공휴일·대체공휴일에는 설문을 보내지 않습니다.

새해 공휴일 또는 임시공휴일은 `src/holidays.ts`에 `YYYY-MM-DD` 형식으로 추가한 뒤, NAS에서 다시 빌드해 주세요.

## 대화방 명령

| 입력 | 동작 |
| --- | --- |
| `@냠요정` | 냠요정이 도와드릴 수 있는 일을 안내해 드립니다. 기본값 또는 현재 알림 시간도 함께 보여드립니다. |
| `@냠요정 현황` | 오늘 점심·저녁 알림 시간을 다시 알려드립니다. |
| `@냠요정 설정 점심 11:30` | 점심 식사 알림 시간을 바꿉니다. |
| `@냠요정 설정 저녁 18:00` | 저녁 식사 알림 시간을 바꿉니다. |

대화방 구성원이라면 누구나 그 대화방의 알림 시간을 바꾸실 수 있습니다. 변경 이력과 설문 응답은 대화방별로 안전하게 나누어 저장됩니다.

## 서버 배포

1. `cp .env.example .env`를 실행한 뒤 Microsoft 앱 값을 입력해 주세요. `.env` 파일은 절대 커밋하지 마세요.

   | 변수 | 값 |
   | --- | --- |
   | `MicrosoftAppId` | Teams 앱 등록 시 발급된 앱 ID |
   | `MicrosoftAppPassword` | 앱 클라이언트 비밀값 |
   | `MicrosoftAppTenantId` | Microsoft 365 테넌트 ID |
   | `PUBLIC_BASE_URL` | `https://meal-bot.namonak.dev` |
   | `DATABASE_PATH` | Docker에서는 `/data/team-meal-bot.sqlite` |
2. HTTPS 프록시에서 `meal-bot.namonak.dev`의 `/api/messages`와 `/healthz`를 `127.0.0.1:3978`로 전달해 주세요.
3. Synology NAS에서는 `docker-compose up -d --build`를 실행해 주세요.
4. `curl https://meal-bot.namonak.dev/healthz`가 `{"ok":true}`를 반환하는지 확인해 주세요.

Nginx 예시는 다음과 같습니다.

```nginx
location / {
  proxy_pass http://127.0.0.1:3978;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

서버를 켤 때 자동으로 실행하려면 `deploy/team-meal-bot.service`의 `WorkingDirectory`를 서버 경로에 맞게 바꾼 뒤 다음 명령을 실행해 주세요.

```bash
sudo cp deploy/team-meal-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now team-meal-bot
sudo systemctl status team-meal-bot
```

## Teams 등록

Teams Developer CLI로 앱을 등록할 때 endpoint는 `https://meal-bot.namonak.dev/api/messages`로 지정해 주세요. `.env`의 `MicrosoftAppId`를 입력한 뒤 아래 명령을 실행하면 manifest와 PNG 아이콘 두 개만 담긴 ZIP이 만들어집니다. 앱 ID만 ZIP에 들어가며 비밀값은 포함되지 않습니다.

프로젝트 최상단(`.env`, `appPackage` 폴더가 보이는 위치)에서 실행해 주세요. NAS의 `/volume1/docker/team-meal-bot`과 로컬 PC의 저장소 경로 모두에서 가능합니다.

```bash
cd /volume1/docker/team-meal-bot
git pull origin main
./scripts/package-teams-app.sh
```

`Permission denied`가 나오면 실행 권한을 한 번 부여하거나 Bash로 실행해 주세요.

```bash
chmod +x scripts/package-teams-app.sh
# 또는
bash scripts/package-teams-app.sh
```

결과 파일은 한국 시간 기준 `dist/team-meal-bot-YYYYMMDD-HHMMSS.zip` 형식입니다. 앱 이름·소개·아이콘을 바꾼 경우에는 새 ZIP을 만들어 Teams에서 기존 앱을 업데이트해 주세요.

앱을 추가하거나 업데이트한 뒤 `@냠요정`을 보내 안내가 보이면 설치가 완료된 것입니다. 실제 계정이나 테넌트의 비밀값은 저장소에 넣지 마세요.

## 확인 목록

1. `https://meal-bot.namonak.dev/healthz`가 `{"ok":true}`를 반환한다.
2. 대상 단체 대화방에 앱을 추가한다.
3. `@냠요정`으로 현재 알림 시간을 포함한 도움말이 보이는지 확인한다.
4. `@냠요정 설정 점심 11:30`으로 일정 변경이 반영되는지 확인한다.
5. 테스트 시각을 설정해 세 선택 버튼, 메뉴 입력, 카드 집계 갱신을 확인한다.
