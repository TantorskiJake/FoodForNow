const test = require('node:test');
const assert = require('node:assert/strict');

const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const router = require('./auth');
const User = require('../models/user');
const bcrypt = require('bcrypt');

const originalFindById = User.findById;
const originalFindOne = User.findOne;
const originalCompare = bcrypt.compare;
const originalGenSalt = bcrypt.genSalt;
const originalHash = bcrypt.hash;

function getProfileHandler() {
  const profileLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/profile' && layer.route.methods.put
  );
  assert.ok(profileLayer, 'Expected PUT /profile route to be registered');
  return profileLayer.route.stack[profileLayer.route.stack.length - 1].handle;
}

function createMockUser() {
  return {
    _id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'stored-hash',
    bio: null,
    location: null,
    website: null,
    profilePicture: null,
    preferences: {
      theme: 'dark',
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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    async save() {
      this.saved = true;
      return this;
    },
  };
}

function createMockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function restoreStubs() {
  User.findById = originalFindById;
  User.findOne = originalFindOne;
  bcrypt.compare = originalCompare;
  bcrypt.genSalt = originalGenSalt;
  bcrypt.hash = originalHash;
}

test('PUT /profile rejects password changes without current password', async () => {
  const handler = getProfileHandler();
  const user = createMockUser();
  User.findById = async () => user;
  User.findOne = async () => null;

  const req = {
    userId: 'user-1',
    body: { newPassword: 'NewPassword1!' },
  };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Current password is required to set a new password');
  assert.equal(user.saved, undefined);
});

test('PUT /profile rejects password changes when current password is incorrect', async () => {
  const handler = getProfileHandler();
  const user = createMockUser();
  User.findById = async () => user;
  User.findOne = async () => null;
  bcrypt.compare = async () => false;

  const req = {
    userId: 'user-1',
    body: {
      currentPassword: 'WrongPassword1!',
      newPassword: 'NewPassword1!',
    },
  };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Current password is incorrect');
  assert.equal(user.saved, undefined);
});

test('PUT /profile rejects weak replacement passwords even with correct current password', async () => {
  const handler = getProfileHandler();
  const user = createMockUser();
  User.findById = async () => user;
  User.findOne = async () => null;
  bcrypt.compare = async () => true;
  bcrypt.genSalt = async () => {
    throw new Error('genSalt should not run for weak passwords');
  };
  bcrypt.hash = async () => {
    throw new Error('hash should not run for weak passwords');
  };

  const req = {
    userId: 'user-1',
    body: {
      currentPassword: 'CorrectPassword1!',
      newPassword: 'alllowercase1',
    },
  };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Password is too weak');
  assert.equal(user.saved, undefined);
});

test('PUT /profile rejects duplicate email addresses before saving', async () => {
  const handler = getProfileHandler();
  const user = createMockUser();
  User.findById = async () => user;
  User.findOne = async () => ({ _id: 'other-user' });

  const req = {
    userId: 'user-1',
    body: { email: 'already-used@example.com' },
  };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Email already in use');
  assert.equal(user.saved, undefined);
});

test.afterEach(() => {
  restoreStubs();
});

test.after(() => {
  restoreStubs();
  if (originalJwtSecret == null) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});
