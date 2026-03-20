import test from 'node:test';
import assert from 'node:assert/strict';
import { mealsForSelectedWeek } from './mealPlanWeekFilter.js';

test('mealsForSelectedWeek filters meals using UTC date keys', () => {
  const mealPlan = [
    { _id: 'a', weekStart: '2026-03-10T00:00:00.000Z' },
    { _id: 'b', weekStart: '2026-03-09T19:00:00-05:00' },
    { _id: 'c', weekStart: '2026-03-10T00:00:00+09:00' },
    { _id: 'd', weekStart: '2026-03-09T23:59:59.999Z' },
    { _id: 'e', weekStart: '' },
  ];

  const filtered = mealsForSelectedWeek(mealPlan, '2026-03-10');
  assert.deepEqual(
    filtered.map((meal) => meal._id),
    ['a', 'b']
  );
});

test('mealsForSelectedWeek ignores meals without weekStart', () => {
  const mealPlan = [{ _id: 'a' }, { _id: 'b', weekStart: null }, { _id: 'c', weekStart: '2026-03-10T12:00:00Z' }];
  const filtered = mealsForSelectedWeek(mealPlan, '2026-03-10');
  assert.deepEqual(filtered.map((meal) => meal._id), ['c']);
});

test('mealsForSelectedWeek returns input when no selected week or non-array meal plan', () => {
  const mealPlan = [{ _id: 'a', weekStart: '2026-03-10T00:00:00.000Z' }];
  assert.equal(mealsForSelectedWeek(mealPlan, ''), mealPlan);

  const notArray = { _id: 'x' };
  assert.equal(mealsForSelectedWeek(notArray, '2026-03-10'), notArray);
});

test('mealsForSelectedWeek skips invalid meal weekStart values without throwing', () => {
  const mealPlan = [
    { _id: 'valid', weekStart: '2026-03-10T08:00:00.000Z' },
    { _id: 'invalid', weekStart: 'not-a-date' },
    { _id: 'missing' },
  ];

  const filtered = mealsForSelectedWeek(mealPlan, '2026-03-10');
  assert.deepEqual(filtered.map((meal) => meal._id), ['valid']);
});

test('mealsForSelectedWeek returns original input for non-string selected week values', () => {
  const mealPlan = [{ _id: 'a', weekStart: '2026-03-10T00:00:00.000Z' }];
  assert.equal(mealsForSelectedWeek(mealPlan, new Date('2026-03-10')), mealPlan);
});
