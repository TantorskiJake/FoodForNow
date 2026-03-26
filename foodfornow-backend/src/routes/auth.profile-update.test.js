const test = require('node:test');
const assert = require('node:assert/strict');

const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const { __internal } = require('./auth');

function createUserFixture() {
  return {
    preferences: {
      theme: 'light',
      units: 'metric',
      language: 'en',
      timezone: 'UTC',
    },
    notifications: {
      email: true,
      push: true,
      mealReminders: true,
      shoppingReminders: true,
    },
  };
}

test('applyPreferenceUpdates updates only supported string fields', () => {
  const user = createUserFixture();

  __internal.applyPreferenceUpdates(user, {
    theme: 'dark',
    units: 42,
    language: 'fr',
    timezone: null,
  });

  assert.deepEqual(user.preferences, {
    theme: 'dark',
    units: 'metric',
    language: 'fr',
    timezone: 'UTC',
  });
});

test('applyPreferenceUpdates ignores nullish, scalar, and array inputs', () => {
  const invalidInputs = [null, undefined, 'dark', 123, true, ['theme']];

  for (const input of invalidInputs) {
    const user = createUserFixture();
    __internal.applyPreferenceUpdates(user, input);
    assert.deepEqual(user.preferences, {
      theme: 'light',
      units: 'metric',
      language: 'en',
      timezone: 'UTC',
    });
  }
});

test('applyNotificationUpdates updates only supported boolean fields', () => {
  const user = createUserFixture();

  __internal.applyNotificationUpdates(user, {
    email: false,
    push: 'nope',
    mealReminders: false,
    shoppingReminders: 0,
  });

  assert.deepEqual(user.notifications, {
    email: false,
    push: true,
    mealReminders: false,
    shoppingReminders: true,
  });
});

test('applyNotificationUpdates ignores nullish, scalar, and array inputs', () => {
  const invalidInputs = [null, undefined, 'off', 0, false, ['email']];

  for (const input of invalidInputs) {
    const user = createUserFixture();
    __internal.applyNotificationUpdates(user, input);
    assert.deepEqual(user.notifications, {
      email: true,
      push: true,
      mealReminders: true,
      shoppingReminders: true,
    });
  }
});

test.after(() => {
  if (originalJwtSecret == null) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});
