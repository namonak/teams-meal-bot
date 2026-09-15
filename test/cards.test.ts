import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSurveyCard } from '../src/cards.js';

test('builds a polite poll with each response group and member names', () => {
  const card = buildSurveyCard('점심', [
    { memberId: 'u1', memberName: '최정 (Jeong Choi)', status: 'join', menu: '국밥' },
    { memberId: 'u2', memberName: 'Lee', status: 'join', menu: '국밥' },
    { memberId: 'u3', memberName: 'Park', status: 'separate', menu: null },
  ], 7);
  assert.equal(card.type, 'AdaptiveCard');
  assert.match(JSON.stringify(card), /오늘 점심, 어떻게 드실까요/);
  assert.match(JSON.stringify(card), /같이 먹을래요 \(2명\)\\n최정 · Lee/);
  assert.match(JSON.stringify(card), /따밥입니다! \(1명\)\\nPark/);
  assert.match(JSON.stringify(card), /조금 더 고민할게요 \(0명\)\\n아직 없어요/);
  assert.match(JSON.stringify(card), /국밥 2/);
  assert.match(JSON.stringify(card), /오늘 드시고 싶은 메뉴가 있다면 살짝 남겨주세요/);
  assert.deepEqual(card.actions?.map((action: any) => action.title), ['🍽 같이 먹을래요', '🏃 따밥입니다!', '🫧 조금 더 고민할게요']);
  assert.deepEqual(card.actions?.map((action: any) => action.data.status), ['join', 'separate', 'undecided']);
});

test('removes the submit action from a closed survey card', () => {
  const card = buildSurveyCard('점심', [], 1, true);
  assert.deepEqual(card.actions, []);
});

test('uses evening-specific choices for a dinner poll', () => {
  const card = buildSurveyCard('저녁', [], 1);
  assert.deepEqual(card.actions?.map((action: any) => action.title), ['🍽️ 같이 먹을래요', '🚪 퇴근입니다!', '🫧 조금 더 고민할게요']);
});
