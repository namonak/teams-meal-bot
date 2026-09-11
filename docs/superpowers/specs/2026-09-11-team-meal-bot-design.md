# Team Meal Bot Design

## Goal

Provide one existing Microsoft Teams group chat with a `@밥부장` bot that asks
members about lunch and dinner plans, collects menu preferences, and maintains
a live summary.

## Scope

### Included

- One group chat: the first group chat in which the app is installed becomes
  the active conversation.
- Weekday surveys at 11:15 (lunch) and 17:45 (dinner), Asia/Seoul time.
- Adaptive Card responses: join, eat separately, undecided, and optional menu.
- Live card summary, current-day status, help, and member-editable schedules.
- Docker Compose deployment on the existing HTTPS server.

### Excluded

- AI menu recommendations, LLMs, and external databases.
- Support for multiple group chats, Teams channels, or organisation-wide use.
- Role-based administration. Any active-chat member can change a schedule.
- Recovery of a survey missed while the server was offline.

## Architecture

One Node.js TypeScript service uses Teams SDK for incoming activities and
proactive messages. It is exposed through the existing reverse proxy at a
dedicated `*.joannes.kr` HTTPS hostname.

The service has one persistent SQLite file mounted as a Docker volume. It
stores the active group chat, schedules, surveys, latest response per member,
and schedule-change history. No separate database, queue, cron host, or cloud
service is used.

`docker-compose` starts the service and restarts it on failure. A host
`systemd` unit starts the Compose stack on boot. The reverse proxy remains on
the host and forwards the public `/api/messages` path to the container.

## Teams App

The app manifest declares a bot/agent with the `groupchat` scope only. A chat
member uploads the custom app package and adds it to the target group chat.
On its first installation, the service saves that conversation ID. Requests
from every other conversation are ignored.

Teams request authentication uses the Microsoft application ID, tenant ID, and
client secret supplied only through `.env`. The manifest uses the public bot
hostname as a valid domain and the service endpoint is
`https://<bot-host>/api/messages`.

## User Experience

### Surveys

At each scheduled time the service creates one survey keyed by Seoul calendar
date and meal type. Its Adaptive Card contains a participation choice and one
optional free-text menu field.

- A member can resubmit; their most recent response replaces the old one.
- Menu text is ignored unless the member chooses to eat together.
- After each valid response, the original card is updated with participant,
  separate, and undecided names plus grouped menu counts.
- Lunch closes at 14:00 and dinner closes at 20:00 Asia/Seoul time. A closed
  card retains its final summary and rejects later submissions.

### Mentions

Only direct bot mentions are processed in the active group chat.

| Input | Result |
| --- | --- |
| `@밥부장` | Usage help |
| `@밥부장 현황` | Today's lunch and dinner summaries |
| `@밥부장 설정 점심 HH:MM` | Validate and change lunch schedule |
| `@밥부장 설정 저녁 HH:MM` | Validate and change dinner schedule |

Every accepted schedule change is announced in the group chat and persisted
with actor, old time, new time, and Seoul timestamp. Invalid commands and
invalid times receive a concise error plus usage syntax.

## Reliability Rules

- Incoming activities must pass Teams authentication and match the active
  conversation ID.
- A SQLite uniqueness constraint on `(date_kst, meal_type)` prevents a
  restart or duplicate scheduler tick from posting another survey.
- The scheduler calculates in `Asia/Seoul`, not the server's local timezone.
- A service restart schedules only future triggers. It never backfills a
  missed survey.
- Card actions validate survey state and conversation before writing. Unknown
  or closed surveys are rejected without altering stored responses.

## Data Model

| Table | Essential fields |
| --- | --- |
| `conversation` | `id`, `teams_conversation_id`, `installed_at` |
| `schedule` | `meal_type`, `time_kst` |
| `survey` | `id`, `date_kst`, `meal_type`, `status`, `message_id`, `opens_at`, `closes_at` |
| `response` | `survey_id`, `member_id`, `member_name`, `status`, `menu`, `updated_at` |
| `schedule_change` | `meal_type`, `old_time`, `new_time`, `actor_id`, `actor_name`, `changed_at` |

`response` is unique on `(survey_id, member_id)` and is updated in place.
Only member IDs and display names required to render the current summary are
stored; no general chat content is retained.

## Configuration and Deployment

Required runtime variables:

- `MICROSOFT_APP_ID`
- `MICROSOFT_APP_PASSWORD`
- `MICROSOFT_APP_TENANT_ID`
- `PUBLIC_BASE_URL`
- `DATABASE_PATH`

The tracked `.env.example` documents names only. `.env`, the SQLite file, and
generated Teams app packages are ignored by Git. The host supplies TLS and
forwards only the bot endpoint to the container.

## Verification

Automated tests cover Seoul-time schedule calculation, command/time validation,
response upsert behavior, survey closing, and duplicate-survey prevention.

Manual acceptance checks cover custom package upload, group-chat installation,
empty mention help, settings changes by two different members, Adaptive Card
resubmission and live update, both scheduled sends, and rejection from another
conversation.

## Deliberate Limits

The first installation wins as the active conversation. To move the bot, an
operator resets the local SQLite data and installs the app in the intended
group chat. This avoids a multi-chat configuration UI for a single-chat MVP.
