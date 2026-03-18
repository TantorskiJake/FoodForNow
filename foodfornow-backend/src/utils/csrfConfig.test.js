const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_ORIGINS,
  parseAllowedOrigins,
  shouldBypassCsrfForRequest,
} = require('./csrfConfig');

test('parseAllowedOrigins returns defaults when CORS_ORIGIN is unset', () => {
  const allowedOrigins = parseAllowedOrigins();
  assert.deepEqual(allowedOrigins, DEFAULT_ORIGINS);
});

test('parseAllowedOrigins trims and drops empty origin entries', () => {
  const allowedOrigins = parseAllowedOrigins(' https://app.example.com , , http://localhost:5173  ');
  assert.deepEqual(allowedOrigins, ['https://app.example.com', 'http://localhost:5173']);
});

test('shouldBypassCsrfForRequest allows configured origin only in development', () => {
  const shouldBypass = shouldBypassCsrfForRequest({
    isDev: true,
    origin: 'http://localhost:5173',
    allowedOrigins: ['http://localhost:5173'],
  });

  assert.equal(shouldBypass, true);
});

test('shouldBypassCsrfForRequest blocks unconfigured origins in development', () => {
  const shouldBypass = shouldBypassCsrfForRequest({
    isDev: true,
    origin: 'http://192.168.1.25:5173',
    allowedOrigins: ['http://localhost:5173'],
  });

  assert.equal(shouldBypass, false);
});

test('shouldBypassCsrfForRequest does not bypass when origin is missing', () => {
  const shouldBypass = shouldBypassCsrfForRequest({
    isDev: true,
    origin: undefined,
    allowedOrigins: ['http://localhost:5173'],
  });

  assert.equal(shouldBypass, false);
});

test('shouldBypassCsrfForRequest never bypasses in production', () => {
  const shouldBypass = shouldBypassCsrfForRequest({
    isDev: false,
    origin: 'http://localhost:5173',
    allowedOrigins: ['http://localhost:5173'],
  });

  assert.equal(shouldBypass, false);
});
