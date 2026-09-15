import assert from 'node:assert/strict';
import test from 'node:test';
import { cardActionResponse, createApp } from '../src/index.js';

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
