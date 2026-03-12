const test = require('node:test');
const assert = require('node:assert/strict');

const originalJwtSecret = process.env.JWT_SECRET;
const originalNodeEnv = process.env.NODE_ENV;
const originalExposeFlag = process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE;

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
const { __internal } = require('./auth');

test('forgot-password response does not include reset token by default', () => {
  process.env.NODE_ENV = 'development';
  delete process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE;

  const payload = __internal.buildForgotPasswordResponse('sensitive-token');
  assert.equal(payload.success, true);
  assert.match(payload.message, /reset link/i);
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'resetToken'), false);
});

test('forgot-password response does not include reset token in production', () => {
  process.env.NODE_ENV = 'production';
  process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE = 'true';

  const payload = __internal.buildForgotPasswordResponse('sensitive-token');
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'resetToken'), false);
});

test('forgot-password response includes token only with explicit non-production opt-in', () => {
  process.env.NODE_ENV = 'development';
  process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE = 'true';

  const payload = __internal.buildForgotPasswordResponse('sensitive-token');
  assert.equal(payload.resetToken, 'sensitive-token');
});

test('forgot-password response omits token when explicit opt-in is set but token is missing', () => {
  process.env.NODE_ENV = 'development';
  process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE = 'true';

  const payload = __internal.buildForgotPasswordResponse();
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'resetToken'), false);
});

test.after(() => {
  if (originalJwtSecret == null) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;

  if (originalNodeEnv == null) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;

  if (originalExposeFlag == null) delete process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE;
  else process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE = originalExposeFlag;
});
