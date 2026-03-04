const test = require('node:test');
const assert = require('node:assert/strict');
const { errorPayload } = require('./httpErrors');

test('errorPayload includes both error and message keys', () => {
  const payload = errorPayload('Ingredient not found');
  assert.deepEqual(payload, {
    error: 'Ingredient not found',
    message: 'Ingredient not found',
  });
});

test('errorPayload merges extras', () => {
  const payload = errorPayload('Conflict', { existingId: 'abc123' });
  assert.equal(payload.error, 'Conflict');
  assert.equal(payload.message, 'Conflict');
  assert.equal(payload.existingId, 'abc123');
});
