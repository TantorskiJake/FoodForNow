import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY_NAMES, getOrderedDayNames, getStartOfWeek } from './dashboardWeekUtils.js';

test('getStartOfWeek returns midnight at configured week start', () => {
  // Local calendar Wednesday 18 Mar 2026 (avoids TZ-dependent UTC instant parsing)
  const date = new Date(2026, 2, 18, 15, 45, 30, 123);
  const start = getStartOfWeek(date, 1); // Monday

  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(start.getSeconds(), 0);
  assert.equal(start.getMilliseconds(), 0);
  assert.equal(start.getDay(), 1);
  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 2);
  assert.equal(start.getDate(), 16);
});

test('getStartOfWeek supports Sunday starts without mutating input date', () => {
  const original = new Date(2026, 2, 18, 15, 45, 30, 123);
  const originalTime = original.getTime();
  const start = getStartOfWeek(original, 0); // Sunday

  assert.equal(start.getDay(), 0);
  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 2);
  assert.equal(start.getDate(), 15);
  assert.equal(original.getTime(), originalTime);
});

test('getStartOfWeek crosses year boundaries correctly', () => {
  const date = new Date(2026, 0, 1, 12, 0, 0, 0); // local Thu 1 Jan 2026
  const mondayStart = getStartOfWeek(date, 1);

  assert.equal(mondayStart.getDay(), 1);
  assert.equal(mondayStart.getFullYear(), 2025);
  assert.equal(mondayStart.getMonth(), 11);
  assert.equal(mondayStart.getDate(), 29);
});

test('getOrderedDayNames rotates weekdays based on selected week start', () => {
  assert.deepEqual(getOrderedDayNames(1), ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  assert.deepEqual(getOrderedDayNames(0), DAY_NAMES);
  assert.deepEqual(getOrderedDayNames(6), ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
});
