import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('Teams 패키지에는 치환된 manifest와 아이콘만 담긴다', () => {
  const directory = mkdtempSync(join(tmpdir(), 'team-meal-package-'));
  try {
    cpSync(join(process.cwd(), 'appPackage'), join(directory, 'appPackage'), { recursive: true });
    writeFileSync(join(directory, '.env'), 'MicrosoftAppId=test-client-id\nMicrosoftAppPassword=must-not-be-packaged\n');

    const result = spawnSync('bash', [join(process.cwd(), 'scripts/package-teams-app.sh')], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);

    const [archive] = readdirSync(join(directory, 'dist'));
    assert.match(archive, /^team-meal-bot-\d{8}-\d{6}\.zip$/);
    const path = join(directory, 'dist', archive);
    const files = spawnSync('unzip', ['-Z1', path], { encoding: 'utf8' });
    assert.deepEqual(files.stdout.trim().split('\n').sort(), ['color.png', 'manifest.json', 'outline.png']);
    const manifest = spawnSync('unzip', ['-p', path, 'manifest.json'], { encoding: 'utf8' });
    assert.match(manifest.stdout, /test-client-id/);
    const app = JSON.parse(manifest.stdout);
    assert.equal(app.packageName, undefined);
    assert.match(app.accentColor, /^#[0-9A-F]{6}$/i);
    assert.deepEqual(app.bots[0].scopes, ['groupChat']);
    assert.deepEqual(app.validDomains, ['meal-bot.namonak.dev']);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
