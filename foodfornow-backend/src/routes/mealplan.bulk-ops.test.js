const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const { buildMissingShoppingListBulkOps, __internal } = require('./mealplan');
const { getWeekRangeUtc } = __internal;

test('buildMissingShoppingListBulkOps aggregates duplicate ingredient+unit rows', () => {
  const userId = 'user-1';
  const ingredientA = { _id: 'ing-a' };
  const ingredientB = { _id: 'ing-b' };

  const ops = buildMissingShoppingListBulkOps(userId, [
    { ingredient: ingredientA, quantity: 1, unit: 'cup' },
    { ingredient: ingredientA, quantity: 2.5, unit: 'cup' },
    { ingredient: ingredientA, quantity: 1, unit: 'tbsp' },
    { ingredient: ingredientB, quantity: 3, unit: 'piece' },
  ]);

  assert.deepEqual(ops, [
    {
      updateOne: {
        filter: { user: userId, ingredient: 'ing-a', unit: 'cup', completed: false },
        update: { $inc: { quantity: 3.5 } },
        upsert: true
      }
    },
    {
      updateOne: {
        filter: { user: userId, ingredient: 'ing-a', unit: 'tbsp', completed: false },
        update: { $inc: { quantity: 1 } },
        upsert: true
      }
    },
    {
      updateOne: {
        filter: { user: userId, ingredient: 'ing-b', unit: 'piece', completed: false },
        update: { $inc: { quantity: 3 } },
        upsert: true
      }
    }
  ]);
});

test('buildMissingShoppingListBulkOps skips invalid rows', () => {
  const ops = buildMissingShoppingListBulkOps('user-1', [
    { ingredient: { _id: 'ing-a' }, quantity: 0, unit: 'cup' },
    { ingredient: { _id: 'ing-a' }, quantity: -2, unit: 'cup' },
    { ingredient: {}, quantity: 2, unit: 'cup' },
    { ingredient: { _id: 'ing-a' }, quantity: 1 },
  ]);

  assert.deepEqual(ops, []);
});

test('getWeekRangeUtc parses date-only input as UTC week boundaries', () => {
  const { start, end } = getWeekRangeUtc('2026-03-09');

  assert.equal(start.toISOString(), '2026-03-09T00:00:00.000Z');
  assert.equal(end.toISOString(), '2026-03-16T00:00:00.000Z');
  assert.equal(end.getTime() - start.getTime(), 7 * 24 * 60 * 60 * 1000);
});

test('getWeekRangeUtc ignores time and timezone offset in ISO input', () => {
  const { start, end } = getWeekRangeUtc('2026-03-09T23:30:00-05:00');

  assert.equal(start.toISOString(), '2026-03-09T00:00:00.000Z');
  assert.equal(end.toISOString(), '2026-03-16T00:00:00.000Z');
});
