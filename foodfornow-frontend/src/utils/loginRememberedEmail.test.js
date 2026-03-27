import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REMEMBERED_LOGIN_KEY,
  getRememberedEmail,
  setRememberedEmail,
  clearRememberedCredentials,
} from './loginRememberedEmail.js';

function createMemoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
    dump() {
      return Object.fromEntries(store.entries());
    },
  };
}

test('getRememberedEmail returns persisted email when JSON payload is valid', () => {
  const storage = createMemoryStorage({
    [REMEMBERED_LOGIN_KEY]: JSON.stringify({ email: 'saved@example.com' }),
  });

  assert.equal(getRememberedEmail(storage), 'saved@example.com');
});

test('getRememberedEmail returns null for invalid or non-email payloads', () => {
  const badJsonStorage = createMemoryStorage({
    [REMEMBERED_LOGIN_KEY]: '{this is not json',
  });
  assert.equal(getRememberedEmail(badJsonStorage), null);

  const badShapeStorage = createMemoryStorage({
    [REMEMBERED_LOGIN_KEY]: JSON.stringify({ email: 123 }),
  });
  assert.equal(getRememberedEmail(badShapeStorage), null);
});

test('getRememberedEmail returns null when storage access throws', () => {
  const throwingStorage = {
    getItem() {
      throw new Error('localStorage unavailable');
    },
  };

  assert.equal(getRememberedEmail(throwingStorage), null);
});

test('setRememberedEmail stores serialized email under the expected key', () => {
  const storage = createMemoryStorage();
  setRememberedEmail('person@example.com', storage);

  assert.deepEqual(storage.dump(), {
    [REMEMBERED_LOGIN_KEY]: JSON.stringify({ email: 'person@example.com' }),
  });
});

test('setRememberedEmail tolerates storage write failures', () => {
  const throwingStorage = {
    setItem() {
      throw new Error('quota exceeded');
    },
  };

  assert.doesNotThrow(() => setRememberedEmail('person@example.com', throwingStorage));
});

test('clearRememberedCredentials removes remembered login key', () => {
  const storage = createMemoryStorage({
    [REMEMBERED_LOGIN_KEY]: JSON.stringify({ email: 'saved@example.com' }),
    other: 'value',
  });

  clearRememberedCredentials(storage);
  assert.deepEqual(storage.dump(), { other: 'value' });
});

test('clearRememberedCredentials tolerates storage removal failures', () => {
  const throwingStorage = {
    removeItem() {
      throw new Error('storage locked');
    },
  };

  assert.doesNotThrow(() => clearRememberedCredentials(throwingStorage));
});
