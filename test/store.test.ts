import assert from 'node:assert/strict';
import test from 'node:test';
import { Store } from '../src/store.js';

test('keeps surveys and responses separate for every installed conversation', () => {
  const store = Store.open(':memory:');
  assert.equal(store.activateConversation('chat-1'), true);
  assert.equal(store.activateConversation('chat-2'), true);
  const first = store.createSurvey('chat-1', '2026-09-11', 'lunch', 'message-1');
  const second = store.createSurvey('chat-2', '2026-09-11', 'lunch', 'message-2');
  store.upsertResponse({ surveyId: first.id, memberId: 'u1', memberName: 'Kim', status: 'join', menu: '국밥' });
  store.upsertResponse({ surveyId: second.id, memberId: 'u1', memberName: 'Kim', status: 'join', menu: '돈까스' });
  assert.deepEqual(store.listResponses(first.id), [{ memberId: 'u1', memberName: 'Kim', status: 'join', menu: '국밥' }]);
  assert.deepEqual(store.listResponses(second.id), [{ memberId: 'u1', memberName: 'Kim', status: 'join', menu: '돈까스' }]);
});
