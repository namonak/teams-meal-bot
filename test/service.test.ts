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
});
