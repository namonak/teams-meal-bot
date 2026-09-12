import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSurveyCard } from '../src/cards.js';

test('builds a card with response choices and grouped menu summary', () => {
  const card = buildSurveyCard('점심', [
    { memberId: 'u1', memberName: 'Kim', status: 'join', menu: '국밥' },
    { memberId: 'u2', memberName: 'Lee', status: 'join', menu: '국밥' },
    { memberId: 'u3', memberName: 'Park', status: 'separate', menu: null },
  ]);
  assert.equal(card.type, 'AdaptiveCard');
  assert.match(JSON.stringify(card), /국밥 2/);
  assert.match(JSON.stringify(card), /같이 먹어요/);
});

test('removes the submit action from a closed survey card', () => {
  const card = buildSurveyCard('점심', [], 1, true);
  assert.deepEqual(card.actions, []);
});
