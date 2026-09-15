import assert from 'node:assert/strict';
import test from 'node:test';
import { isOpen, isSchedulable, parseCommand } from '../src/domain.js';

test('parses help, status, and schedule commands', () => {
  assert.deepEqual(parseCommand(''), { type: 'help' });
  assert.deepEqual(parseCommand('현황'), { type: 'status' });
  assert.deepEqual(parseCommand('냠요정 현황'), { type: 'status' });
  assert.deepEqual(parseCommand('<at>밥부장</at> 현황'), { type: 'status' });
  assert.deepEqual(parseCommand('밥부장 설정 점심 11:30'), { type: 'schedule', meal: 'lunch', time: '11:30' });
  assert.deepEqual(parseCommand('밥요정 설정 점심 11:30'), { type: 'schedule', meal: 'lunch', time: '11:30' });
  assert.deepEqual(parseCommand('설정 점심 11:30'), { type: 'schedule', meal: 'lunch', time: '11:30' });
  assert.deepEqual(parseCommand('설정 저녁 25:00'), { type: 'invalid' });
});

test('closes lunch at 14:00 and dinner at 20:00 Seoul time', () => {
  assert.equal(isOpen('lunch', new Date('2026-09-11T04:59:00Z')), true);
  assert.equal(isOpen('lunch', new Date('2026-09-11T05:00:00Z')), false);
  assert.equal(isOpen('dinner', new Date('2026-09-11T10:59:00Z')), true);
  assert.equal(isOpen('dinner', new Date('2026-09-11T11:00:00Z')), false);
});

test('allows alert times only before each meal closes', () => {
  assert.equal(isSchedulable('lunch', '13:59'), true);
  assert.equal(isSchedulable('lunch', '14:00'), false);
  assert.equal(isSchedulable('dinner', '19:59'), true);
  assert.equal(isSchedulable('dinner', '20:00'), false);
});
