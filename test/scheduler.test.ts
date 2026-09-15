import assert from 'node:assert/strict';
import test from 'node:test';
import { dueMeals } from '../src/scheduler.js';

test('returns only meals due on Korean working days', () => {
  assert.deepEqual(dueMeals(new Date('2026-09-14T02:15:00Z'), { lunch: '11:15', dinner: '17:45' }), ['lunch']);
  assert.deepEqual(dueMeals(new Date('2026-09-13T02:15:00Z'), { lunch: '11:15', dinner: '17:45' }), []);
  assert.deepEqual(dueMeals(new Date('2026-09-14T05:15:00Z'), { lunch: '14:15', dinner: '17:45' }), []);
  assert.deepEqual(dueMeals(new Date('2026-05-25T02:15:00Z'), { lunch: '11:15', dinner: '17:45' }), []);
  assert.deepEqual(dueMeals(new Date('2027-07-19T08:45:00Z'), { lunch: '11:15', dinner: '17:45' }), []);
});
