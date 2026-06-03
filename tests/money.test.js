// C10a — tests-first for dashboard derivation.
// Pure-logic tests for source/utils/money.js (node:test + node:assert/strict).

import test from 'node:test';
import assert from 'node:assert/strict';
import { calcMargin } from '../source/utils/money.js';

test('calcMargin computes dollar amount and percent', () => {
  assert.deepEqual(calcMargin(100, 60), { marginDollar: '40.00', margin: '40.0' });
  assert.deepEqual(calcMargin('250.5', '100.25'), { marginDollar: '150.25', margin: '60.0' });
});

test('calcMargin handles cost greater than value (negative margin)', () => {
  assert.deepEqual(calcMargin(100, 150), { marginDollar: '-50.00', margin: '-50.0' });
});

test('calcMargin returns empty for missing or non-numeric inputs', () => {
  assert.deepEqual(calcMargin('', '60'), { marginDollar: '', margin: '' });
  assert.deepEqual(calcMargin('100', ''), { marginDollar: '', margin: '' });
  assert.deepEqual(calcMargin('abc', 'def'), { marginDollar: '', margin: '' });
});

test('calcMargin returns empty when annual value is zero', () => {
  assert.deepEqual(calcMargin(0, 60), { marginDollar: '', margin: '' });
});

// C10a-fix: a $0 vendor cost with a valid sale value is a legitimate
// 100%-margin item and must produce a real margin (previously returned empty
// because the `!cost` guard treated 0 as missing).
test('calcMargin: zero cost with a valid value yields 100% margin', () => {
  assert.deepEqual(calcMargin(100, 0), { marginDollar: '100.00', margin: '100.0' });
});

// Missing cost (not zero) must still return empty.
test('calcMargin: missing cost (empty/null/undefined) still returns empty', () => {
  assert.deepEqual(calcMargin(100, ''), { marginDollar: '', margin: '' });
  assert.deepEqual(calcMargin(100, null), { marginDollar: '', margin: '' });
  assert.deepEqual(calcMargin(100, undefined), { marginDollar: '', margin: '' });
});

// calcMargin uses parseFloat and does NOT strip "$" or thousands separators.
// Money strings must be pre-parsed (e.g. by importMoney) before reaching calcMargin.
test('calcMargin expects pre-parsed numbers, not currency-formatted strings', () => {
  assert.deepEqual(calcMargin('$100', '$60'), { marginDollar: '', margin: '' }); // parseFloat('$100') === NaN
});
