import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY_NAMES, getOrderedDayNames, getStartOfWeek } from './dashboardWeekUtils.js';

test('getStartOfWeek returns midnight at configured week start', () => {
  const date = new Date('2026-03-18T15:45:30.123Z'); // Wednesday
  const start = getStartOfWeek(date, 1); // Monday

  assert.equal(start.toISOString(), '2026-03-16T00:00:00.000Z');
});

test('getStartOfWeek supports Sunday starts without mutating input date', () => {
  const original = new Date('2026-03-18T15:45:30.123Z'); // Wednesday
  const originalIso = original.toISOString();
  const start = getStartOfWeek(original, 0); // Sunday

  assert.equal(start.toISOString(), '2026-03-15T00:00:00.000Z');
  assert.equal(original.toISOString(), originalIso);
});

test('getStartOfWeek crosses year boundaries correctly', () => {
  const date = new Date('2026-01-01T12:00:00.000Z'); // Thursday
  const mondayStart = getStartOfWeek(date, 1);

  assert.equal(mondayStart.toISOString(), '2025-12-29T00:00:00.000Z');
});

test('getOrderedDayNames rotates weekdays based on selected week start', () => {
  assert.deepEqual(getOrderedDayNames(1), ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  assert.deepEqual(getOrderedDayNames(0), DAY_NAMES);
  assert.deepEqual(getOrderedDayNames(6), ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
});
