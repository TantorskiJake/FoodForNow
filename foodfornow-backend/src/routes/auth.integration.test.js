/**
 * HTTP integration tests for /api/auth (mini Express app, no global CSRF).
 * Env must be set before loading auth routes or middleware.
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-integration';
process.env.LOGIN_RATE_LIMIT_MAX = '9999';
process.env.SIGNUP_RATE_LIMIT_MAX = '9999';
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

const User = require('../models/user');
const RefreshToken = require('../models/refreshToken');
const PasswordResetToken = require('../models/passwordResetToken');
const Achievement = require('../models/achievement');

const authRoutes = require('./auth');

const STRONG_PASSWORD = 'TestPassword123!';
const ALT_STRONG_PASSWORD = 'NewPassword456!';

function uniqueEmail() {
  return `u${Date.now()}-${Math.random().toString(36).slice(2, 10)}@example.com`;
}

/** Extract first cookie value for name from supertest Set-Cookie array */
function cookieValueFromSetCookie(setCookie, name) {
  const prefix = `${name}=`;
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie].filter(Boolean);
  for (const line of headers) {
    if (typeof line === 'string' && line.startsWith(prefix)) {
      return line.split(';')[0].slice(prefix.length);
    }
  }
  return null;
}

/** Raw `refreshToken=...` pair (first segment of matching Set-Cookie line) */
function refreshTokenPairFromSetCookie(setCookie) {
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie].filter(Boolean);
  for (const line of headers) {
    if (typeof line === 'string' && line.startsWith('refreshToken=')) {
      return line.split(';')[0].trim();
    }
  }
  return '';
}

async function clearAuthCollections() {
  await Promise.all([
    User.deleteMany({}),
    RefreshToken.deleteMany({}),
    PasswordResetToken.deleteMany({}),
    Achievement.deleteMany({}),
  ]);
}

let mongoServer;
let app;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = express();
  app.disable('x-powered-by');
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

test.beforeEach(async () => {
  await clearAuthCollections();
});

test('POST /register returns 400 when fields are missing', async () => {
  const res = await request(app).post('/api/auth/register').send({}).expect(400);
  assert.match(res.body.error || '', /required/i);
});

test('POST /register returns 400 for weak password', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'A', email: uniqueEmail(), password: 'short' })
    .expect(400);
  assert.ok(res.body.error);
});

test('POST /register returns 400 for invalid email', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'A', email: 'not-an-email', password: STRONG_PASSWORD })
    .expect(400);
  assert.match(res.body.error || '', /email/i);
});

test('POST /register returns 201 and user on success', async () => {
  const email = uniqueEmail();
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email, password: STRONG_PASSWORD })
    .expect(201);
  assert.ok(res.body.user);
  assert.equal(res.body.user.email, email);
  assert.ok(res.body.user.id || res.body.user._id);
  assert.ok(res.headers['set-cookie']);
});

test('POST /register returns 400 for duplicate email', async () => {
  const email = uniqueEmail();
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'One', email, password: STRONG_PASSWORD })
    .expect(201);
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Two', email, password: STRONG_PASSWORD })
    .expect(400);
  assert.match(res.body.error || '', /already/i);
});

test('POST /login returns 400 when email or password missing', async () => {
  const res = await request(app).post('/api/auth/login').send({}).expect(400);
  assert.ok(res.body.error);
});

test('POST /login returns 401 for wrong password', async () => {
  const email = uniqueEmail();
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'U', email, password: STRONG_PASSWORD })
    .expect(201);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'WrongPassword1!' })
    .expect(401);
  assert.ok(res.body.error);
});

test('POST /login returns 200 and sets cookies', async () => {
  const email = uniqueEmail();
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'U', email, password: STRONG_PASSWORD })
    .expect(201);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: STRONG_PASSWORD })
    .expect(200);
  assert.equal(res.body.user.email, email);
  const cookies = res.headers['set-cookie'];
  assert.ok(cookieValueFromSetCookie(cookies, 'accessToken'));
  assert.ok(cookieValueFromSetCookie(cookies, 'refreshToken'));
});

test('GET /me returns 401 without cookies', async () => {
  await request(app).get('/api/auth/me').expect(401);
});

test('GET /me returns 200 with user profile when authenticated', async () => {
  const email = uniqueEmail();
  const agent = request.agent(app);
  await agent
    .post('/api/auth/register')
    .send({ name: 'Profile User', email, password: STRONG_PASSWORD })
    .expect(201);
  const res = await agent.get('/api/auth/me').expect(200);
  assert.equal(res.body.user.email, email);
  assert.ok('preferences' in res.body.user);
  assert.ok('notifications' in res.body.user);
});

test('POST /token returns 401 without refresh cookie', async () => {
  await request(app).post('/api/auth/token').expect(401);
});

test('POST /token returns 200 then 403 when reusing refresh token after rotation', async () => {
  const email = uniqueEmail();
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'T', email, password: STRONG_PASSWORD })
    .expect(201);

  const agent = request.agent(app);
  const resLogin = await agent.post('/api/auth/login').send({ email, password: STRONG_PASSWORD }).expect(200);
  const replayCookie = refreshTokenPairFromSetCookie(resLogin.headers['set-cookie']);
  assert.ok(replayCookie);

  await agent.post('/api/auth/token').expect(200);

  const replay = await request(app).post('/api/auth/token').set('Cookie', replayCookie).expect(403);
  assert.ok(replay.body.error);
});

test('POST /logout clears session so /me is unauthorized', async () => {
  const email = uniqueEmail();
  const agent = request.agent(app);
  await agent
    .post('/api/auth/register')
    .send({ name: 'L', email, password: STRONG_PASSWORD })
    .expect(201);
  await agent.get('/api/auth/me').expect(200);
  await agent.post('/api/auth/logout').expect(200);
  await agent.get('/api/auth/me').expect(401);
});

test('POST /forgot-password returns generic success for unknown email', async () => {
  const res = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'nobody-at-all@example.com' })
    .expect(200);
  assert.equal(res.body.success, true);
  assert.equal(Object.prototype.hasOwnProperty.call(res.body, 'resetToken'), false);
});

test('POST /forgot-password requires email', async () => {
  await request(app).post('/api/auth/forgot-password').send({}).expect(400);
});

test('POST /reset-password with invalid token returns 400', async () => {
  const res = await request(app)
    .post('/api/auth/reset-password')
    .send({ token: 'deadbeef', newPassword: ALT_STRONG_PASSWORD })
    .expect(400);
  assert.ok(res.body.error);
});

test('forgot then reset allows login with new password', async () => {
  const email = uniqueEmail();
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'R', email, password: STRONG_PASSWORD })
    .expect(201);

  await request(app).post('/api/auth/forgot-password').send({ email }).expect(200);

  const doc = await PasswordResetToken.findOne({}).lean();
  assert.ok(doc && doc.token);

  await request(app)
    .post('/api/auth/reset-password')
    .send({ token: doc.token, newPassword: ALT_STRONG_PASSWORD })
    .expect(200);

  await request(app)
    .post('/api/auth/login')
    .send({ email, password: STRONG_PASSWORD })
    .expect(401);

  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password: ALT_STRONG_PASSWORD }).expect(200);
});

test('PUT /profile returns 401 without auth', async () => {
  await request(app).put('/api/auth/profile').send({ name: 'X' }).expect(401);
});

test('PUT /profile updates fields when authenticated', async () => {
  const email = uniqueEmail();
  const agent = request.agent(app);
  await agent
    .post('/api/auth/register')
    .send({ name: 'Before', email, password: STRONG_PASSWORD })
    .expect(201);
  const res = await agent.put('/api/auth/profile').send({ name: 'After', bio: 'Hello' }).expect(200);
  assert.equal(res.body.user.name, 'After');
  assert.equal(res.body.user.bio, 'Hello');
});

test('PUT /profile returns 401 when current password is wrong for password change', async () => {
  const email = uniqueEmail();
  const agent = request.agent(app);
  await agent
    .post('/api/auth/register')
    .send({ name: 'P', email, password: STRONG_PASSWORD })
    .expect(201);
  await agent
    .put('/api/auth/profile')
    .send({
      currentPassword: 'WrongPassword1!',
      newPassword: ALT_STRONG_PASSWORD,
    })
    .expect(401);
});

test('PUT /profile returns 400 for weak newPassword when current password is correct', async () => {
  const email = uniqueEmail();
  const agent = request.agent(app);
  await agent
    .post('/api/auth/register')
    .send({ name: 'P', email, password: STRONG_PASSWORD })
    .expect(201);
  await agent
    .put('/api/auth/profile')
    .send({
      currentPassword: STRONG_PASSWORD,
      newPassword: 'weak',
    })
    .expect(400);
});
