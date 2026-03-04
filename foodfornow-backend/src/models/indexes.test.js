const test = require('node:test');
const assert = require('node:assert/strict');
const MealPlan = require('./mealPlan');
const Achievement = require('./achievement');

function hasIndex(indexes, key, optionsMatcher = () => true) {
  return indexes.some(([candidateKey, candidateOptions]) => {
    return (
      JSON.stringify(candidateKey) === JSON.stringify(key) &&
      optionsMatcher(candidateOptions || {})
    );
  });
}

test('MealPlan schema includes cooked history index', () => {
  const indexes = MealPlan.schema.indexes();
  assert.equal(
    hasIndex(indexes, { user: 1, cooked: 1, createdAt: 1 }),
    true
  );
});

test('Achievement schema includes recent completed index', () => {
  const indexes = Achievement.schema.indexes();
  assert.equal(
    hasIndex(indexes, { userId: 1, completed: 1, completedAt: -1 }),
    true
  );
});

