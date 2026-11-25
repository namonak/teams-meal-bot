# 냠요정 (Team Meal Bot)

Teams 단체 대화방에 평일 점심·저녁 식사 알림을 보내고, 같이 먹을 사람과 메뉴를 모아 주는 봇입니다.

- GitHub 저장소: [namonak/teams-meal-bot](https://github.com/namonak/teams-meal-bot)
- 운영 주소: `https://meal-bot.namonak.dev`
- 구성: TypeScript, Microsoft Agents SDK, SQLite, Docker Compose
- 이름 규칙: GitHub 저장소만 `teams-meal-bot`이고, 로컬 폴더·컨테이너·DB·ZIP 파일은 `team-meal-bot`을 그대로 사용합니다.

## 식사 알림

| 구분 | 기본 알림 | 마감 | 선택지 |
| --- | --- | --- | --- |
| 점심 | 평일 11:15 | 14:00 | 같이 먹을래요 / 따밥입니다! / 조금 더 고민할게요 |
| 저녁 | 평일 17:45 | 20:00 | 같이 먹을래요 / 퇴근입니다! / 조금 더 고민할게요 |

- 모든 시각은 한국 시간입니다.
- 카드에서 각자의 선택과 참여자 이름을 바로 확인할 수 있습니다.
- **같이 먹을래요**를 고른 사람만 메뉴를 적을 수 있으며, 카드에 메뉴 집계를 함께 표시합니다.
- 응답을 바꾸면 카드의 인원과 메뉴 집계가 바로 갱신됩니다.
- 앱을 설치한 대화방마다 따로 동작하고 따로 저장합니다.
- 주말과 2026~2027년 법정공휴일·대체공휴일에는 알림을 보내지 않습니다.
- 새 공휴일이나 임시공휴일은 `src/holidays.ts`에 `YYYY-MM-DD` 형식으로 추가한 뒤 서버에서 다시 빌드해 주세요.

## 대화방 명령

Teams에서 `@냠요정`을 입력한 뒤, 목록에 나오는 봇 멘션을 선택해서 보내 주세요.

| 입력 | 동작 |
| --- | --- |
| `@냠요정` | 사용법과 현재 알림 시간 안내 |
| `@냠요정 현황` | 오늘 점심·저녁 알림 시간 안내 |
| `@냠요정 설정 점심 11:30` | 점심 알림 시간 변경 |
| `@냠요정 설정 저녁 18:00` | 저녁 알림 시간 변경 |

- 알림 시간은 점심 14:00 전, 저녁 20:00 전으로만 설정할 수 있습니다.
- 대화방 구성원이면 누구나 그 대화방의 알림 시간을 바꿀 수 있습니다.

## 로컬 개발

준비물: Node 24 이상, npm, bash, zip, unzip

```bash
npm ci
cp .env.example .env    # 냠요정 앱 정보를 입력해 주세요
npm test
npm run typecheck
node --env-file=.env --import tsx src/index.ts
```

- `npm start`는 `.env`를 읽지 않고 셸 환경 변수를 사용합니다.
- 인증 필수값이 없으면 서버가 시작되지 않습니다.
- `.env`의 `DATABASE_PATH` 기본값은 컨테이너 경로입니다. 로컬에서 실행할 때는 `./data/team-meal-bot.sqlite`처럼 바꿔 주세요.
- `.env`와 SQLite 파일은 Git에 올리지 않습니다.

| 환경 변수 | 값 |
| --- | --- |
| `MicrosoftAppId` | Azure 봇 ID (Developer Portal의 앱 ID가 아닙니다) |
| `MicrosoftAppPassword` | 봇 클라이언트 비밀값 |
| `MicrosoftAppTenantId` | Microsoft 365 테넌트 ID |
| `PUBLIC_BASE_URL` | `https://meal-bot.namonak.dev` (기록용이며 서버 바인딩이나 프록시를 설정하지 않습니다) |
| `DATABASE_PATH` | 컨테이너 `/data/team-meal-bot.sqlite` |
| `PORT` | 컨테이너 내부 `3978` |

## 보안 검사

`.github/workflows/security.yml`이 main 푸시, PR, 수동 실행, 매일 03:00 KST에 실행됩니다.

- 의존성 검사: 테스트와 타입 검사 뒤 `npm audit --omit=dev --audit-level=moderate` 실행
- 이미지 검사: Docker 이미지를 빌드해 Trivy(컨테이너 이미지 취약점 검사 도구) v0.76.2로 수정 가능한 HIGH·CRITICAL 취약점 검사
- 차단 기준: 두 검사 중 하나라도 취약점을 찾으면 워크플로가 실패합니다.
- 버전 고정: 간접 의존성 `body-parser` 2.4.0, `proxy-addr` 2.0.8을 `package.json`의 `overrides`로 고정합니다.
- 운영 이미지: 실행에 쓰지 않는 npm과 npx를 삭제합니다. 컨테이너 안에서는 `node`만 사용해 주세요.
- Dependabot: GitHub 취약점 알림과 자동 보안 업데이트를 켜 두었습니다.

## 서버 배포

1. 저장소를 내려받고 `.env`를 설정합니다. 다른 봇의 앱 ID와 비밀값은 재사용하지 않습니다.

   ```bash
   git clone https://github.com/namonak/teams-meal-bot.git ~/workspace/teams-meal-bot
   cd ~/workspace/teams-meal-bot
   cp .env.example .env
   chmod 600 .env
   ```

2. Caddyfile에 아래 설정을 추가하고, `caddy validate`로 검사한 뒤 `caddy reload`로 재시작 없이 반영합니다. HTTPS 인증서는 Caddy가 자동으로 발급하고 갱신합니다.

   ```caddyfile
   meal-bot.namonak.dev {
       reverse_proxy 127.0.0.1:3978
   }
   ```

3. `docker compose up -d --build`로 실행합니다. 구형 환경에서는 `docker-compose`를 사용합니다.
4. `curl https://meal-bot.namonak.dev/healthz`가 `{"ok":true}`를 반환하는지 확인합니다.

운영 기준

- 호스트 포트: 3978 (투표곰 3979, 쿠웨이트박 3980과 겹치지 않음)
- 자동 실행: Compose의 `restart: unless-stopped`로 서버를 재부팅해도 다시 실행됩니다. systemd로 관리하려면 `deploy/team-meal-bot.service`의 WorkingDirectory를 서버 경로로 바꿔서 사용해 주세요.
- 데이터: `meal-data` 볼륨에 보관합니다. `docker compose down -v`는 볼륨을 삭제하므로 사용하지 않습니다.
- 도메인 변경 시 함께 바꿀 항목: `.env`, DNS·Caddy, Azure 봇 메시지 엔드포인트, `appPackage/manifest.json`의 `validDomains`

코드 업데이트 반영

```bash
cd ~/workspace/teams-meal-bot
git pull --ff-only
docker compose up -d --build
```

서버 코드만 바뀐 경우에는 Teams 앱을 다시 설치하지 않아도 됩니다.

## Teams 앱 등록과 설치

- 등록: Teams Developer CLI 또는 Developer Portal과 Azure Bot에서 냠요정 앱을 등록합니다.
- 메시지 엔드포인트: `https://meal-bot.namonak.dev/api/messages`
- 서버 설정과 일치 필요: 봇 ID, 비밀값, 테넌트
- 조직에서 사용자 지정 앱 업로드를 허용해야 합니다.

ZIP 만들기(프로젝트 최상단에서 실행)

```bash
bash scripts/package-teams-app.sh
```

- 출력 파일: `dist/team-meal-bot-YYYYMMDD-HHMMSS.zip` (한국 시간 기준)
- 포함 파일: `manifest.json`, `color.png`, `outline.png`. 앱 ID만 들어가고 비밀값은 들어가지 않습니다.
- 앱 ID: `.env`의 `MicrosoftAppId`로 manifest를 채웁니다.
- 현재 manifest 버전: 1.0.3

설치와 업데이트

- 처음 설치: Teams 앱 관리 화면에서 **사용자 지정 앱 업로드**로 ZIP을 올린 뒤 단체 대화방에 추가해 주세요.
- 업데이트: 이름·소개·아이콘을 바꾸면 manifest의 `version`을 올리고, 새 ZIP을 같은 방법으로 업로드해 주세요. 앱을 삭제하고 다시 설치할 필요는 없습니다.
- 주의: ZIP으로 설치한 앱은 Developer Portal에서 버전을 올려도 업데이트되지 않습니다.

## Teams 실사용 확인 항목

- `https://meal-bot.namonak.dev/healthz`가 `{"ok":true}`를 반환하는지
- 대상 단체 대화방에 앱을 추가한 뒤 `@냠요정`으로 현재 알림 시간이 포함된 안내가 표시되는지
- `@냠요정 설정 점심 11:30`으로 알림 시간이 바뀌는지
- 테스트 시각을 설정해 세 선택 버튼, 메뉴 입력, 카드 집계 갱신이 동작하는지

## 참고 문서

- 설계 문서: [식사 봇](docs/superpowers/specs/2026-09-11-team-meal-bot-design.md), [메뉴 투표 카드](docs/superpowers/specs/2026-09-15-meal-poll-card-design.md)
- 구현 계획: [식사 봇](docs/superpowers/plans/2026-09-11-team-meal-bot.md), [메뉴 투표 카드](docs/superpowers/plans/2026-09-15-meal-poll-card.md)
