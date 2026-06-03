// C10a — tests-first for dashboard derivation (optional coverage).
// Pure-logic tests for source/importSandbox/importDuplicates.js.
// Assertions check key prefixes / counts and Set logic, so they do not couple
// to normalizeImportText internals.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDuplicateKeys,
  isDuplicateByKeys,
  addKeysToSet,
  matchesExistingRecord,
} from '../source/importSandbox/importDuplicates.js';

test('buildDuplicateKeys: complete license emits one namespaced key', () => {
  const keys = buildDuplicateKeys('licenses', {
    clientDepartment: 'Banisi',
    brandManufacturer: 'Trend Micro',
    productLicenseName: 'Vision One',
    expirationRenewalDate: '2026-05-26',
  });
  assert.equal(keys.length, 1);
  assert.ok(keys[0].startsWith('lic:'));
});

test('buildDuplicateKeys: sparse license (no expiration) emits no key', () => {
  const keys = buildDuplicateKeys('licenses', { clientDepartment: 'Banisi' });
  assert.deepEqual(keys, []);
});

test('buildDuplicateKeys: hardware with serial emits hw-serial key', () => {
  const keys = buildDuplicateKeys('hardware', { serialNumber: 'SN-ABC-123' });
  assert.equal(keys.length, 1);
  assert.ok(keys[0].startsWith('hw-serial:'));
});

test('buildDuplicateKeys: contract number + expiration emits con key', () => {
  const keys = buildDuplicateKeys('contracts', {
    contractNumber: 'C-1001',
    expirationRenewalDate: '2026-07-01',
  });
  assert.equal(keys.length, 1);
  assert.ok(keys[0].startsWith('con:'));
});

test('isDuplicateByKeys: empty keys never match', () => {
  const seen = new Set(['lic:a|b|c']);
  assert.equal(isDuplicateByKeys([], seen), false);
  assert.equal(isDuplicateByKeys(undefined, seen), false);
});

test('isDuplicateByKeys / addKeysToSet round-trip', () => {
  const seen = new Set();
  const keys = ['lic:banisi|trend|vision|2026-05-26'];
  assert.equal(isDuplicateByKeys(keys, seen), false);
  addKeysToSet(keys, seen);
  assert.equal(isDuplicateByKeys(keys, seen), true);
  // A different key is not a duplicate.
  assert.equal(isDuplicateByKeys(['lic:other'], seen), false);
});

test('matchesExistingRecord: shared duplicateKey -> true, none -> false', () => {
  const existing = { meta: { duplicateKeys: ['lic:k1', 'csp:k2'] } };
  assert.equal(matchesExistingRecord({ duplicateKeys: ['lic:k1'] }, existing), true);
  assert.equal(matchesExistingRecord({ duplicateKeys: ['lic:zzz'] }, existing), false);
});

test('matchesExistingRecord: falls back to importKey equality when no duplicateKeys', () => {
  const existing = { meta: { importKey: 'batch-1-row-3' } };
  assert.equal(matchesExistingRecord({ importKey: 'batch-1-row-3' }, existing), true);
  assert.equal(matchesExistingRecord({ importKey: 'batch-1-row-9' }, existing), false);
});

test('matchesExistingRecord: guards null inputs', () => {
  assert.equal(matchesExistingRecord(null, { meta: {} }), false);
  assert.equal(matchesExistingRecord({ duplicateKeys: ['x'] }, null), false);
  assert.equal(matchesExistingRecord({ duplicateKeys: ['x'] }, {}), false);
});
