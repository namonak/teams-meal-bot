# Meal Poll Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render each scheduled meal survey as a cute, fixed three-choice poll with an optional free-text menu suggestion.

**Architecture:** Keep `Store`, `MealService`, and the `mealResponse` endpoint unchanged: they already persist one response per member and accept a menu only for a join response. Change the Adaptive Card builder to render three `Action.Execute` buttons that supply `status`, alongside the existing text input, and derive the visible counts and menu summary from existing responses.

**Tech Stack:** TypeScript, Node.js built-in test runner, Microsoft Adaptive Cards 1.5.

**Spec:** `docs/superpowers/specs/2026-09-15-meal-poll-card-design.md`

## Global Constraints

- Reuse existing `mealResponse` handling and SQLite response schema.
- Add no package dependencies.
- Use Korean copy exactly as defined by the spec.
- Retain empty `actions` for a closed survey.
- Commit with an Angular-style Korean message, a concise body, and `Co-authored-by: Codex (AI-generated) <codex@joannes.kr>`.

---

### Task 1: Fixed poll Adaptive Card

**Files:**
- Modify: `test/cards.test.ts`
- Modify: `src/cards.ts`

**Interfaces:**
- Consumes: `buildSurveyCard(meal, responses, surveyId?, closed?)`.
- Produces: an Adaptive Card with three `Action.Execute` actions, each carrying `{ surveyId, status }` and `verb: 'mealResponse'`.

- [x] **Step 1: Write the failing test**

```ts
test('builds a friendly fixed poll with counts, menu input, and vote actions', () => {
  const card = buildSurveyCard('점심', [
    { memberId: 'u1', memberName: 'Kim', status: 'join', menu: '국밥' },
    { memberId: 'u2', memberName: 'Lee', status: 'join', menu: '국밥' },
    { memberId: 'u3', memberName: 'Park', status: 'separate', menu: null },
  ], 7);
  assert.match(JSON.stringify(card), /오늘 점심, 어떻게 할래/);
  assert.match(JSON.stringify(card), /같이 먹자 2명/);
  assert.match(JSON.stringify(card), /점따 1명/);
  assert.match(JSON.stringify(card), /국밥 2/);
  assert.match(JSON.stringify(card), /오늘 땡기는 메뉴 있으면 툭 남겨줘/);
  assert.deepEqual(card.actions?.map((action: any) => action.data.status), ['join', 'separate', 'undecided']);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern='friendly fixed poll'`

Expected: FAIL because the current card has no named action statuses and uses the old copy.

- [x] **Step 3: Write minimal implementation**

```ts
const counts = { join: 0, separate: 0, undecided: 0 };
for (const response of responses) counts[response.status]++;
const actions = [
  ['🍽 같이 먹자', 'join'],
  ['🏃 점따', 'separate'],
  ['🫧 고민 중', 'undecided'],
].map(([title, status]) => ({ type: 'Action.Execute', title, verb: 'mealResponse', data: { surveyId, status } }));
```

Use the counts in a text block, retain the `Input.Text` with id `menu`, show
the grouped join-menu summary, and use `actions: []` when `closed` is true.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- --test-name-pattern='friendly fixed poll|closed survey'`

Expected: PASS.

### Task 2: Update operator documentation

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the final fixed-poll behaviour from Task 1.
- Produces: accurate feature list and a short response-flow description.

- [x] **Step 1: Update the feature description**

Replace the formal participation wording with the three visible choices and
state that only `같이 먹자` menu suggestions are grouped in the live card.

- [x] **Step 2: Verify no operational instructions changed**

Run: `git diff -- README.md`

Expected: only feature and verification wording changes; deployment and Teams
packaging commands remain unchanged.

### Task 3: Verify and commit

**Files:**
- Modify: `docs/superpowers/plans/2026-09-15-meal-poll-card.md` (check completed tasks)

- [x] **Step 1: Run full verification**

Run: `npm test && npm run typecheck && docker build .`

Expected: all tests, TypeScript checking, and the production Docker image build pass.

- [x] **Step 2: Inspect the final diff**

Run: `git diff --check && git diff --stat`

Expected: no whitespace error and changes limited to the card, its tests, docs, and plan/spec.

- [x] **Step 3: Commit the implementation**

```text
feat(투표): 식사 설문 카드를 고정 투표로 개선

세 가지 식사 상태와 메뉴 제안을 한 카드에서 집계하도록 개선한다.

Co-authored-by: Codex (AI-generated) <codex@joannes.kr>
```
