const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'mw-test-jwt-secret';

const auth = require('./auth');

function createRes() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    body: undefined,
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('returns 401 when accessToken cookie is missing', async () => {
  const req = { cookies: {} };
  const res = createRes();
  let nextCalls = 0;
  const next = () => {
    nextCalls += 1;
  };

  await auth(req, res, next);

  assert.equal(nextCalls, 0);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Please login');
});

test('returns 401 Invalid token on JsonWebTokenError', async (t) => {
  t.mock.method(jwt, 'verify', () => {
    const err = new Error('invalid signature');
    err.name = 'JsonWebTokenError';
    throw err;
  });

  const req = { cookies: { accessToken: 'bad' } };
  const res = createRes();
  let nextCalls = 0;

  await auth(req, res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 0);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Invalid token');
});

test('returns 401 Token expired on TokenExpiredError', async (t) => {
  t.mock.method(jwt, 'verify', () => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    throw err;
  });

  const req = { cookies: { accessToken: 'expired' } };
  const res = createRes();
  let nextCalls = 0;

  await auth(req, res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 0);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Token expired');
});

test('returns 401 when payload has no user id', async (t) => {
  t.mock.method(jwt, 'verify', () => ({}));

  const req = { cookies: { accessToken: 'tok' } };
  const res = createRes();
  let nextCalls = 0;

  await auth(req, res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 0);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Invalid token');
});

test('returns 401 when user no longer exists', async (t) => {
  const oid = new mongoose.Types.ObjectId();
  t.mock.method(jwt, 'verify', () => ({ userId: oid.toString() }));
  t.mock.method(User, 'findById', async () => null);

  const req = { cookies: { accessToken: 'tok' } };
  const res = createRes();
  let nextCalls = 0;

  await auth(req, res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 0);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'User no longer exists');
});

test('calls next and sets req.userId when token and user are valid', async (t) => {
  const oid = new mongoose.Types.ObjectId();
  t.mock.method(jwt, 'verify', () => ({ userId: oid.toString() }));
  t.mock.method(User, 'findById', async () => ({ _id: oid }));

  const req = { cookies: { accessToken: 'tok' } };
  const res = createRes();
  let nextCalls = 0;

  await auth(req, res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 1);
  assert.equal(req.userId, oid);
});

test('accepts id claim when userId is absent', async (t) => {
  const oid = new mongoose.Types.ObjectId();
  t.mock.method(jwt, 'verify', () => ({ id: oid.toString() }));
  t.mock.method(User, 'findById', async () => ({ _id: oid }));

  const req = { cookies: { accessToken: 'tok' } };
  const res = createRes();
  let nextCalls = 0;

  await auth(req, res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 1);
  assert.equal(req.userId, oid);
});

test.after(() => {
  if (originalJwtSecret == null) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});
