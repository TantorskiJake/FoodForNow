const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const { getWeekRangeUtc } = require('./mealplan');

test('getWeekRangeUtc builds an inclusive start and exclusive 7-day end in UTC', () => {
  const { start, end } = getWeekRangeUtc('2026-03-09');

  assert.equal(start.toISOString(), '2026-03-09T00:00:00.000Z');
  assert.equal(end.toISOString(), '2026-03-16T00:00:00.000Z');
});

test('getWeekRangeUtc anchors week start to UTC midnight from date portion', () => {
  const { start, end } = getWeekRangeUtc('2026-03-09T23:30:00-07:00');

  assert.equal(start.toISOString(), '2026-03-09T00:00:00.000Z');
  assert.equal(end.toISOString(), '2026-03-16T00:00:00.000Z');
});

test('getWeekRangeUtc ignores time and timezone suffixes from ISO datetimes', () => {
  const { start, end } = getWeekRangeUtc('2026-03-09T23:30:00-11:00');

  assert.equal(start.toISOString(), '2026-03-09T00:00:00.000Z');
  assert.equal(end.toISOString(), '2026-03-16T00:00:00.000Z');
});

test('getWeekRangeUtc handles year boundary week windows in UTC', () => {
  const { start, end } = getWeekRangeUtc('2025-12-29');

  assert.equal(start.toISOString(), '2025-12-29T00:00:00.000Z');
  assert.equal(end.toISOString(), '2026-01-05T00:00:00.000Z');
});

test('getCurrentWeekStartUtc snaps any UTC date to Monday UTC midnight', () => {
  const { getCurrentWeekStartUtc } = require('./mealplan');
  const wednesdayUtc = new Date('2026-03-11T18:45:00.000Z');
  const monday = getCurrentWeekStartUtc(wednesdayUtc);

  assert.equal(monday.toISOString(), '2026-03-09T00:00:00.000Z');
});

test('getCurrentWeekStartUtc treats Sunday as previous week Monday in UTC', () => {
  const { getCurrentWeekStartUtc } = require('./mealplan');
  const sundayUtc = new Date('2026-03-15T23:59:59.999Z');
  const monday = getCurrentWeekStartUtc(sundayUtc);

  assert.equal(monday.toISOString(), '2026-03-09T00:00:00.000Z');
});
