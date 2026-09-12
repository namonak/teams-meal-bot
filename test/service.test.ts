import assert from 'node:assert/strict';
import test from 'node:test';
import { MealService } from '../src/service.js';
import { Store } from '../src/store.js';

test('only the active chat can change a schedule and empty mention returns help', () => {
  const store = Store.open(':memory:');
  store.activateConversation('chat-1');
  const service = new MealService(store);
  assert.match(service.mention('chat-1', ''), /사용법/);
  assert.match(service.mention('chat-2', '설정 점심 11:30'), /활성 대화방/);
  assert.match(service.mention('chat-1', '설정 점심 11:30'), /11:30/);
  assert.equal(store.getSchedule('lunch'), '11:30');
  assert.equal(store.listScheduleChanges().length, 1);
});

test('accepts the latest response only for an open survey in the active chat', () => {
  const store = Store.open(':memory:');
  store.activateConversation('chat-1');
  const survey = store.createSurvey('2026-09-12', 'lunch', 'message-1');
  const service = new MealService(store);
  assert.equal(service.submit('chat-1', survey.id, 'u1', 'Kim', 'join', '국밥', new Date('2026-09-12T03:00:00Z')), true);
  assert.deepEqual(store.listResponses(survey.id), [{ memberId: 'u1', memberName: 'Kim', status: 'join', menu: '국밥' }]);
  assert.equal(service.submit('chat-2', survey.id, 'u2', 'Lee', 'join', '돈까스'), false);
});

test('rejects a response after the meal closing time', () => {
  const store = Store.open(':memory:');
  store.activateConversation('chat-1');
  const survey = store.createSurvey('2026-09-12', 'lunch', 'message-1');
  const service = new MealService(store);
  assert.equal(service.submit('chat-1', survey.id, 'u1', 'Kim', 'join', '국밥', new Date('2026-09-12T05:00:00Z')), false);
});
