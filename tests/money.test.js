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

// FINDING (flagged for product review, NOT a test failure): a $0 vendor cost
// (i.e. a legitimately 100%-margin item) currently returns empty because of the
// `!cost` guard treating 0 as "missing". This test documents current behavior.
test('calcMargin: zero cost is treated as missing (current behavior — see report)', () => {
  assert.deepEqual(calcMargin(100, 0), { marginDollar: '', margin: '' });
});

// calcMargin uses parseFloat and does NOT strip "$" or thousands separators.
// Money strings must be pre-parsed (e.g. by importMoney) before reaching calcMargin.
test('calcMargin expects pre-parsed numbers, not currency-formatted strings', () => {
  assert.deepEqual(calcMargin('$100', '$60'), { marginDollar: '', margin: '' }); // parseFloat('$100') === NaN
});
