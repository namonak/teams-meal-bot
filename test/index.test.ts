import assert from 'node:assert/strict';
import test from 'node:test';
import { cardActionResponse, createApp, runScheduledTasks } from '../src/index.js';
import { Store } from '../src/store.js';

test('serves health checks without Teams credentials', async () => {
  const server = createApp().listen(0);
  const { port } = server.address() as { port: number };
  const response = await fetch(`http://127.0.0.1:${port}/healthz`);
  assert.deepEqual(await response.json(), { ok: true });
  server.close();
});

test('returns a message response after a vote instead of replacing the survey card', () => {
  assert.deepEqual(cardActionResponse(true), {
    statusCode: 200,
    type: 'application/vnd.microsoft.activity.message',
    value: '응답을 반영했어요!',
  });
});

test('removes an unsent survey when scheduled delivery fails', async () => {
  const store = Store.open(':memory:');
  store.activateConversation('chat-1', { conversation: { id: 'chat-1' } });
  const adapter = {
    async continueConversation() {
      throw new Error('network_error');
    },
  };

  await runScheduledTasks(adapter, 'app-id', store, new Date('2026-09-14T02:15:00Z'));

  assert.deepEqual(store.listOpenSurveys(), []);
});

test('closes an old unsent survey without trying to update a missing Teams message', async () => {
  const store = Store.open(':memory:');
  store.activateConversation('chat-1', { conversation: { id: 'chat-1' } });
  const survey = store.createSurvey('chat-1', '2026-09-14', 'lunch', '');
  const adapter = {
    async continueConversation() {
      throw new Error('missing message must not be updated');
    },
  };

  await runScheduledTasks(adapter, 'app-id', store, new Date('2026-09-14T05:01:00Z'));

  assert.equal(store.getSurvey(survey.id)?.status, 'closed');
});
