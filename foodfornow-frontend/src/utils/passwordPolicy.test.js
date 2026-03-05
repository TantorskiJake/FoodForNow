import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePasswordStrength, meetsBackendPasswordPolicy } from './passwordPolicy.js';

test('evaluatePasswordStrength flags expected checks', () => {
  assert.deepEqual(evaluatePasswordStrength('Abc123!@'), {
    length: true,
    uppercase: true,
    lowercase: true,
    number: true,
    special: true,
  });

  assert.deepEqual(evaluatePasswordStrength('abcdefg'), {
    length: false,
    uppercase: false,
    lowercase: true,
    number: false,
    special: false,
  });
});

test('meetsBackendPasswordPolicy matches backend strong-password requirements', () => {
  assert.equal(meetsBackendPasswordPolicy('Abc123!@'), true);
  assert.equal(meetsBackendPasswordPolicy('Abcdefgh'), false);
  assert.equal(meetsBackendPasswordPolicy('abc123!@'), false);
});
