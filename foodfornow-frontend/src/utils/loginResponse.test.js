import test from 'node:test';
import assert from 'node:assert/strict';
import { getLoginErrorMessage, getValidLoginUser } from './loginResponse.js';

test('getValidLoginUser accepts nested user payload with id', () => {
  const payload = { user: { id: '123', email: 'jane@example.com' } };
  assert.deepEqual(getValidLoginUser(payload), payload.user);
});

test('getValidLoginUser accepts direct payload with _id', () => {
  const payload = { _id: 'abc', email: 'sam@example.com' };
  assert.deepEqual(getValidLoginUser(payload), payload);
});

test('getValidLoginUser returns null for invalid payloads', () => {
  assert.equal(getValidLoginUser({ user: { email: 'no-id@example.com' } }), null);
  assert.equal(getValidLoginUser({ ok: true }), null);
  assert.equal(getValidLoginUser(null), null);
});

test('getLoginErrorMessage prioritizes API error payload', () => {
  const error = {
    response: {
      data: {
        error: 'Invalid credentials',
      },
    },
    message: 'Request failed with status code 401',
  };
  assert.equal(getLoginErrorMessage(error), 'Invalid credentials');
});

test('getLoginErrorMessage falls back to generic message', () => {
  assert.equal(getLoginErrorMessage({ message: 'Network Error' }), 'Network Error');
  assert.equal(getLoginErrorMessage({}), 'Login failed. Please try again.');
});
