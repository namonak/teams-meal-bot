import assert from 'node:assert/strict';
import test from 'node:test';
import { MealService } from '../src/service.js';
import { Store } from '../src/store.js';

test('every installed chat can change its own schedule with friendly guidance', () => {
  const store = Store.open(':memory:');
  store.activateConversation('chat-1');
  store.activateConversation('chat-2');
  const service = new MealService(store);
  assert.match(service.mention('chat-1', ''), /안녕하세요, 냠요정입니다/);
  assert.match(service.mention('chat-1', ''), /🍚 점심: 11:15/);
  assert.match(service.mention('chat-1', ''), /🌙 저녁: 17:45/);
  assert.equal(service.mention('chat-1', '설정 점심 11:30'), '점심 식사 알림을 11:30에 보내드릴게요! 🍚');
  assert.equal(service.mention('chat-2', '설정 점심 12:00'), '점심 식사 알림을 12:00에 보내드릴게요! 🍚');
  assert.match(service.mention('chat-1', ''), /🍚 점심: 11:30/);
  assert.match(service.mention('chat-1', '알 수 없는 명령'), /앗, 제가 아직 그 말씀은 잘 모르겠어요/);
  assert.equal(store.getSchedule('chat-1', 'lunch'), '11:30');
  assert.equal(store.getSchedule('chat-2', 'lunch'), '12:00');
  assert.equal(store.listScheduleChanges().length, 2);
});

test('keeps the existing schedule when a requested time is after meal close', () => {
  const store = Store.open(':memory:');
  store.activateConversation('chat-1');
  const service = new MealService(store);
  assert.match(service.mention('chat-1', '설정 점심 14:00'), /14:00 전으로 설정해 주세요/);
  assert.match(service.mention('chat-1', '설정 저녁 20:00'), /20:00 전으로 설정해 주세요/);
  assert.equal(store.getSchedule('chat-1', 'lunch'), '11:15');
  assert.equal(store.getSchedule('chat-1', 'dinner'), '17:45');
  assert.equal(store.listScheduleChanges().length, 0);
});

test('accepts responses only in the survey conversation', () => {
  const store = Store.open(':memory:');
  store.activateConversation('chat-1');
  store.activateConversation('chat-2');
  const survey = store.createSurvey('chat-1', '2026-09-12', 'lunch', 'message-1');
  const service = new MealService(store);
  assert.equal(service.submit('chat-1', survey.id, 'u1', 'Kim', 'join', '국밥', new Date('2026-09-12T03:00:00Z')), true);
  assert.deepEqual(store.listResponses(survey.id), [{ memberId: 'u1', memberName: 'Kim', status: 'join', menu: '국밥' }]);
  assert.equal(service.submit('chat-2', survey.id, 'u2', 'Lee', 'join', '돈까스'), false);
});

test('rejects a response after the meal closing time', () => {
  const store = Store.open(':memory:');
  store.activateConversation('chat-1');
  const survey = store.createSurvey('chat-1', '2026-09-12', 'lunch', 'message-1');
  const service = new MealService(store);
  assert.equal(service.submit('chat-1', survey.id, 'u1', 'Kim', 'join', '국밥', new Date('2026-09-12T05:00:00Z')), false);
});
