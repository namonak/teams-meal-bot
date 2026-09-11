# Team Meal Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Docker Compose-hosted Teams group-chat meal survey bot.

**Architecture:** A TypeScript HTTP service receives authenticated Teams activities, stores one active group chat and surveys in SQLite, and schedules KST surveys in-process. The host reverse proxy terminates TLS; Docker persists only the SQLite data directory.

**Tech Stack:** Node.js 24, TypeScript, Teams SDK, SQLite, Docker Compose, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-11-team-meal-bot-design.md`

## Global Constraints

- Support the `groupchat` Teams scope only and accept direct bot mentions only.
- Use Asia/Seoul; defaults are weekdays 11:15 and 17:45; close at 14:00 and 20:00.
- Keep one SQLite file and no external service, LLM, or database.
- Store only active conversation data, survey data, responses, and schedule changes.
- Use AngularJS-style Korean commit messages.

---

## File Structure

- `src/domain.ts`: types and pure parsing/scheduling helpers.
- `src/store.ts`: SQLite schema and all persistence operations.
- `src/cards.ts`: Adaptive Card construction and summary formatting.
- `src/service.ts`: mention, installation, submit, and scheduled-survey orchestration.
- `src/index.ts`: Teams SDK/HTTP integration and process startup.
- `test/*.test.ts`: Node test-runner tests for pure and SQLite-backed behavior.
- `appPackage/manifest.json`: sideloadable group-chat Teams app manifest.
- `Dockerfile`, `compose.yaml`, `.env.example`, `deploy/team-meal-bot.service`: deployment artifacts.

### Task 1: Project skeleton and pure domain rules

**Files:** Create `package.json`, `tsconfig.json`, `src/domain.ts`, `test/domain.test.ts`, `.gitignore`.

**Interfaces:** `parseCommand(text): Command`; `nextOccurrence(now, weekday, time): Date`; `isOpen(meal, now): boolean`.

- [ ] Write failing tests for `@밥부장`, `현황`, valid/invalid setting commands, Seoul weekday scheduling, and meal closing times.
- [ ] Run `npm test` and confirm the missing module fails.
- [ ] Implement only pure types and functions using `Intl.DateTimeFormat`; reject non-`HH:MM` times.
- [ ] Run `npm test` and `npm run typecheck`.
- [ ] Commit `chore: 타입스크립트 봇 기반 추가`.

### Task 2: SQLite persistence

**Files:** Create `src/store.ts`, `test/store.test.ts`.

**Interfaces:** `Store.open(path)`; `activateConversation(id)`; `createSurvey(date, meal, messageId)`; `upsertResponse(response)`; `listResponses(surveyId)`; `setSchedule(meal, time, actor)`.

- [ ] Write failing temporary-database tests for first-conversation-wins, duplicate survey rejection, response replacement, and persisted schedule changes.
- [ ] Run `npm test -- test/store.test.ts` and confirm failure.
- [ ] Implement a single SQLite schema with unique indexes on `(date_kst, meal_type)` and `(survey_id, member_id)`.
- [ ] Run the store test and full typecheck.
- [ ] Commit `feat: 식사 설문 저장소 추가`.

### Task 3: Adaptive Cards and survey service

**Files:** Create `src/cards.ts`, `src/service.ts`, `test/service.test.ts`.

**Interfaces:** `buildSurveyCard(survey, responses)`; `MealService.handleMention(activity)`; `MealService.handleSubmit(activity)`; `MealService.sendSurvey(meal, now)`.

- [ ] Write failing tests that verify menu is ignored for non-participants, a re-submit replaces a response, and the summary card includes grouped menu counts.
- [ ] Run the focused service test and confirm failure.
- [ ] Implement card building, active-chat guards, help/status/settings commands, closed-survey rejection, and card update after every response.
- [ ] Run all tests and typecheck.
- [ ] Commit `feat: 식사 응답 카드와 명령 처리 추가`.

### Task 4: Scheduler and Teams runtime

**Files:** Create `src/scheduler.ts`, `src/index.ts`, `test/scheduler.test.ts`.

**Interfaces:** `startScheduler(service, now): () => void`; `createApp(env): http.Server`.

- [ ] Write failing scheduler tests for weekday 11:15/17:45 execution, no catch-up after restart, and duplicate prevention delegated to the store.
- [ ] Run the focused scheduler test and confirm failure.
- [ ] Implement one timeout-based Seoul scheduler, Teams SDK activity routing, installation capture, mention routing, and Adaptive Card submit routing; read secrets from environment only.
- [ ] Run all tests, typecheck, and start the server with a temporary SQLite path to check `/healthz`.
- [ ] Commit `feat: Teams 런타임과 자동 설문 추가`.

### Task 5: Teams package and container deployment

**Files:** Create `appPackage/manifest.json`, `appPackage/color.png`, `appPackage/outline.png`, `Dockerfile`, `compose.yaml`, `.env.example`, `deploy/team-meal-bot.service`, `README.md`.

**Interfaces:** `docker compose up -d`; public endpoint `/api/messages`; health endpoint `/healthz`.

- [ ] Write a shell smoke check that builds the image and verifies the health endpoint from the Compose network.
- [ ] Run it first and confirm the missing artifacts fail.
- [ ] Add a multi-stage Node 24 image, named volume mounted at `/data`, restart policy, non-secret environment examples, a `groupchat`-only manifest, and deployment instructions for the existing reverse proxy and systemd.
- [ ] Build the image and run the health check; validate manifest JSON with `node -e`.
- [ ] Commit `chore: Docker 배포 구성 추가`.

### Task 6: Final verification and lean review

**Files:** Modify only files required by test or review findings.

- [ ] Run `npm test`, `npm run typecheck`, `docker compose config`, and the container health smoke test.
- [ ] Inspect `git diff HEAD~5..HEAD` using `ponytail:ponytail-review`; remove only confirmed needless complexity.
- [ ] Re-run all checks after any removal.
- [ ] Commit `test: 식사 봇 검증 완료` only if verification changes tracked files.

## Plan Self-Review

- Scope coverage: Tasks 1–4 cover commands, schedules, cards, duplicate prevention, closure, authentication routing, and single-chat operation; Task 5 covers manifest and deployment; Task 6 covers validation.
- No placeholders: all paths, interfaces, test cases, and commands are named.
- Type consistency: `MealService` owns `Store`; `startScheduler` calls `MealService.sendSurvey`; cards consume persisted survey responses.
