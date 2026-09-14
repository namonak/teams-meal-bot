import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('MicrosoftApp 환경 변수만으로 운영 앱을 생성한다', () => {
  const databasePath = join(mkdtempSync(join(tmpdir(), 'team-meal-bot-')), 'bot.sqlite');
  const result = spawnSync(process.execPath, [
    '--import', 'tsx', '--input-type=module', '--eval',
    "import { createApp } from './src/index.ts'; createApp();",
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      NODE_ENV: 'production',
      MicrosoftAppId: 'test-client-id',
      MicrosoftAppPassword: 'test-client-secret',
      MicrosoftAppTenantId: 'test-tenant-id',
      DATABASE_PATH: databasePath,
    },
  });

  assert.equal(result.status, 0, result.stderr);
});
