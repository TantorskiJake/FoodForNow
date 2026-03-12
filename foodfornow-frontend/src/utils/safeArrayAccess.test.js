import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeArrayIndex, getSafeElement } from './safeArrayAccess.js';

test('isSafeArrayIndex accepts only bounded integers', () => {
  assert.equal(isSafeArrayIndex(0, 3), true);
  assert.equal(isSafeArrayIndex(2, 3), true);
  assert.equal(isSafeArrayIndex(-1, 3), false);
  assert.equal(isSafeArrayIndex(3, 3), false);
  assert.equal(isSafeArrayIndex(1.5, 3), false);
});

test('isSafeArrayIndex rejects non-numeric property-like keys', () => {
  assert.equal(isSafeArrayIndex('__proto__', 3), false);
  assert.equal(isSafeArrayIndex('constructor', 3), false);
  assert.equal(isSafeArrayIndex('1', 3), false);
});

test('getSafeElement returns values only for valid indices', () => {
  const arr = ['a', 'b', 'c'];
  assert.equal(getSafeElement(arr, 1), 'b');
  assert.equal(getSafeElement(arr, 2), 'c');
  assert.equal(getSafeElement(arr, 3), null);
  assert.equal(getSafeElement(arr, -1), null);
  assert.equal(getSafeElement(arr, '__proto__'), null);
});

test('getSafeElement returns null for non-arrays', () => {
  assert.equal(getSafeElement(null, 0), null);
  assert.equal(getSafeElement({}, 0), null);
  assert.equal(getSafeElement('abc', 0), null);
});
