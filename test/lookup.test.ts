import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupPhone, normalizePhone } from '../src/lookup.js';

test('normalizes a valid international number', () => {
  const phone = normalizePhone('+14155552671');
  assert.equal(phone.number, '+14155552671');
  assert.equal(phone.country, 'US');
  assert.equal(phone.isPossible(), true);
});

test('rejects an impossible number', () => {
  assert.throws(() => normalizePhone('+1200'), /not possible/i);
});

test('does not perform social reverse search by default', () => {
  const result = lookupPhone('+14155552671');
  assert.equal(result.privacy.searchedPublicly, false);
  assert.equal(result.social[0]?.status, 'not_configured');
});
