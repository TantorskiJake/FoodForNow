const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { getWeekRangeUtc } = require('./mealplan');

test('getWeekRangeUtc anchors week start to UTC midnight from date portion', () => {
  const { start, end } = getWeekRangeUtc('2026-03-09T23:30:00-07:00');

  assert.equal(start.toISOString(), '2026-03-09T00:00:00.000Z');
  assert.equal(end.toISOString(), '2026-03-16T00:00:00.000Z');
});

test('getWeekRangeUtc correctly spans week across calendar year boundary', () => {
  const { start, end } = getWeekRangeUtc('2026-12-31');

  assert.equal(start.toISOString(), '2026-12-31T00:00:00.000Z');
  assert.equal(end.toISOString(), '2027-01-07T00:00:00.000Z');
});
