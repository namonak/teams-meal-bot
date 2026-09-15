import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSurveyCard } from '../src/cards.js';

test('builds a friendly fixed poll with counts, menu input, and vote actions', () => {
  const card = buildSurveyCard('점심', [
    { memberId: 'u1', memberName: 'Kim', status: 'join', menu: '국밥' },
    { memberId: 'u2', memberName: 'Lee', status: 'join', menu: '국밥' },
    { memberId: 'u3', memberName: 'Park', status: 'separate', menu: null },
  ], 7);
  assert.equal(card.type, 'AdaptiveCard');
  assert.match(JSON.stringify(card), /오늘 점심, 어떻게 할래/);
  assert.match(JSON.stringify(card), /같이 먹자 2명/);
  assert.match(JSON.stringify(card), /점따 1명/);
  assert.match(JSON.stringify(card), /국밥 2/);
  assert.match(JSON.stringify(card), /오늘 땡기는 메뉴 있으면 툭 남겨줘/);
  assert.deepEqual(card.actions?.map((action: any) => action.data.status), ['join', 'separate', 'undecided']);
});

test('removes the submit action from a closed survey card', () => {
  const card = buildSurveyCard('점심', [], 1, true);
  assert.deepEqual(card.actions, []);
});
