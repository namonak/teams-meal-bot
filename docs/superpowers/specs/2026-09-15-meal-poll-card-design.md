# Meal Poll Card Design

## Goal

Make each scheduled lunch and dinner survey feel like a friendly fixed poll,
while retaining the existing per-member response and optional menu input.

## Behaviour

- A survey presents three explicit actions: `🍽 같이 먹자`, `🏃 점따`, and
  `🫧 고민 중`.
- The card keeps one optional text input with the prompt
  `오늘 땡기는 메뉴 있으면 툭 남겨줘!`.
- Choosing an action submits that action and the input value. A later action
  from the same member replaces their earlier response; menus only count for
  `같이 먹자`.
- The card shows response counts and grouped menu counts after every response.
- A closed card retains the final counts and has no actions.

## Presentation

- Lunch title: `🍚 오늘 점심, 어떻게 할래?`
- Dinner title: `🌙 오늘 저녁, 어떻게 할래?`
- Open cards say `지금 투표 중 · 점심 14:00 마감` or
  `지금 투표 중 · 저녁 20:00 마감`.
- Closed cards say `투표 마감 · 함께한 선택을 확인해 봐!`.

## Constraints

- Use the existing Adaptive Cards 1.5 support, SQLite schema, and action
  endpoint. Do not add dependencies or a new persistence model.
- Keep the existing weekday schedules and per-conversation isolation.
