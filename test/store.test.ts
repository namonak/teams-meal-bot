import assert from 'node:assert/strict';
import test from 'node:test';
import { Store } from '../src/store.js';

test('keeps the first active conversation and replaces a member response', () => {
  const store = Store.open(':memory:');
  assert.equal(store.activateConversation('chat-1'), true);
  assert.equal(store.activateConversation('chat-2'), false);
  const survey = store.createSurvey('2026-09-11', 'lunch', 'message-1');
  store.upsertResponse({ surveyId: survey.id, memberId: 'u1', memberName: 'Kim', status: 'join', menu: '국밥' });
  store.upsertResponse({ surveyId: survey.id, memberId: 'u1', memberName: 'Kim', status: 'separate', menu: 'ignored' });
  assert.deepEqual(store.listResponses(survey.id), [{ memberId: 'u1', memberName: 'Kim', status: 'separate', menu: null }]);
});
