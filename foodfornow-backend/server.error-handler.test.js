const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const originalJwtSecret = process.env.JWT_SECRET;
const originalCsrfSecret = process.env.CSRF_SECRET;
const originalNodeEnv = process.env.NODE_ENV;

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.CSRF_SECRET = process.env.CSRF_SECRET || 'test-csrf-secret';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const { app, globalErrorHandler } = require('./server');

test('POST /api requests without CSRF token return a structured CSRF error', async () => {
  const response = await request(app).post('/api/recipes').send({ name: 'Tomato Soup' });

  assert.equal(response.status, 403);
  assert.equal(response.body.error, 'Security verification failed. Please refresh the page and try again.');
  assert.equal(response.body.message, 'Security verification failed. Please refresh the page and try again.');
  assert.equal(response.body.code, 'EBADCSRFTOKEN');
});

function createMockResponse() {
  return {
    headersSent: false,
    statusCode: null,
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

test('global error handler preserves explicit message for exposed 4xx errors', () => {
  const err = new Error('Client input failed validation');
  err.status = 422;
  const req = {};
  const res = createMockResponse();

  globalErrorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.error, 'Client input failed validation');
  assert.equal(res.body.message, 'Client input failed validation');
});

test('global error handler redacts unexposed 4xx error messages', () => {
  const err = new Error('Internal validation details');
  err.statusCode = 400;
  err.expose = false;
  const req = {};
  const res = createMockResponse();

  globalErrorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Request could not be completed.');
  assert.equal(res.body.message, 'Request could not be completed.');
});

test('global error handler responds with generic payload for server errors', () => {
  const err = new Error('Database timed out');
  err.status = 503;
  const req = {};
  const res = createMockResponse();

  globalErrorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, 'Something went wrong!');
  assert.equal(res.body.message, 'Something went wrong!');
});

test.after(() => {
  if (originalJwtSecret == null) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;

  if (originalCsrfSecret == null) delete process.env.CSRF_SECRET;
  else process.env.CSRF_SECRET = originalCsrfSecret;

  if (originalNodeEnv == null) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});
