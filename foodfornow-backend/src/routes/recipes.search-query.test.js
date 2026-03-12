const test = require('node:test');
const assert = require('node:assert/strict');

const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const { __internal } = require('./recipes');

test('sanitizeSearchQuery returns empty string for nullish input', () => {
  assert.equal(__internal.sanitizeSearchQuery(undefined), '');
  assert.equal(__internal.sanitizeSearchQuery(null), '');
});

test('sanitizeSearchQuery trims and escapes regex metacharacters', () => {
  const input = '  pasta.*(test)?$[]{}|\\\\  ';
  const sanitized = __internal.sanitizeSearchQuery(input);
  assert.equal(sanitized, 'pasta\\.\\*\\(test\\)\\?\\$\\[\\]\\{\\}\\|\\\\\\\\');
});

test('sanitizeSearchQuery coerces non-string input and escapes safely', () => {
  const sanitized = __internal.sanitizeSearchQuery(12345);
  assert.equal(sanitized, '12345');
});

test('sanitizeSearchQuery enforces max length before escaping', () => {
  const oversized = `  ${'a'.repeat(__internal.SEARCH_MAX_LENGTH + 100)}  `;
  const sanitized = __internal.sanitizeSearchQuery(oversized);
  assert.equal(sanitized.length, __internal.SEARCH_MAX_LENGTH);
  assert.equal(sanitized, 'a'.repeat(__internal.SEARCH_MAX_LENGTH));
});

test.after(() => {
  if (originalJwtSecret == null) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});
