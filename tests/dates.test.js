// C10a — tests-first for dashboard derivation.
// Pure-logic tests for source/utils/dates.js using Node's built-in test runner
// (node:test + node:assert/strict) — no new dependencies.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAlertThresholdDays,
  calcExpirationState,
  calcRiskLevel,
  suggestRenewalDate,
  inferLicenseTerm,
  daysUntil,
} from '../source/utils/dates.js';

// Deterministic YYYY-MM-DD relative to today (local midnight), so date-relative
// assertions stay stable regardless of when the suite runs.
function dateOffset(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

test('getAlertThresholdDays maps known policies and falls back to 30', () => {
  assert.equal(getAlertThresholdDays('90 / 60 / 30 days'), 90);
  assert.equal(getAlertThresholdDays('60 / 30 / 7 days'), 60);
  assert.equal(getAlertThresholdDays('30 / 7 / 1 days'), 30);
  assert.equal(getAlertThresholdDays('Workspace default'), 30);
  assert.equal(getAlertThresholdDays(undefined), 30);
});

test('getAlertThresholdDays Custom uses max valid reminder day', () => {
  assert.equal(getAlertThresholdDays('Custom', '10, 20, 5'), 20);
  assert.equal(getAlertThresholdDays('Custom', ''), 30);    // empty -> 30
  assert.equal(getAlertThresholdDays('Custom', 'abc'), 30); // invalid -> 30
  assert.equal(getAlertThresholdDays('Custom', '-3, 7'), 7); // negatives filtered out
});

test('calcExpirationState handles missing/invalid dates', () => {
  assert.deepEqual(calcExpirationState(''), { systemStatus: 'Pending date', daysToExpiration: '' });
  assert.deepEqual(calcExpirationState('not-a-date'), { systemStatus: 'Pending date', daysToExpiration: '' });
});

test('calcExpirationState: expired date', () => {
  const r = calcExpirationState(dateOffset(-5), '90 / 60 / 30 days');
  assert.equal(r.systemStatus, 'Expired');
  assert.equal(r.daysToExpiration, '5 days overdue');
});

test('calcExpirationState: expiring soon within threshold', () => {
  const r = calcExpirationState(dateOffset(20), '90 / 60 / 30 days'); // 20 <= 90
  assert.equal(r.systemStatus, 'Expiring soon');
  assert.equal(r.daysToExpiration, '20 days');
});

test('calcExpirationState: active beyond threshold', () => {
  const r = calcExpirationState(dateOffset(200), '90 / 60 / 30 days'); // 200 > 90
  assert.equal(r.systemStatus, 'Active');
  assert.equal(r.daysToExpiration, '200 days');
});

test('calcExpirationState: singular "1 day" label', () => {
  const r = calcExpirationState(dateOffset(1), '30 / 7 / 1 days');
  assert.equal(r.daysToExpiration, '1 day');
});

test('calcRiskLevel derives from days to expiration', () => {
  assert.equal(calcRiskLevel(dateOffset(3)), 'Critical');  // <= 7
  assert.equal(calcRiskLevel(dateOffset(20)), 'High');     // <= 30
  assert.equal(calcRiskLevel(dateOffset(60)), 'Medium');   // <= 90
  assert.equal(calcRiskLevel(dateOffset(200)), 'Low');     // > 90
  assert.equal(calcRiskLevel(dateOffset(-1)), 'Critical'); // expired
});

test('calcRiskLevel falls back to businessCriticality without a date', () => {
  assert.equal(calcRiskLevel('', null, null, 'Critical'), 'Critical');
  assert.equal(calcRiskLevel('', null, null, 'High'), 'High');
  assert.equal(calcRiskLevel('', null, null, 'Medium'), 'Medium');
  assert.equal(calcRiskLevel('', null, null, ''), 'Low');
});

test('calcRiskLevel: criticality can raise risk above the date-based level', () => {
  assert.equal(calcRiskLevel(dateOffset(200), null, null, 'Critical'), 'Critical');
});

test('suggestRenewalDate adds the term span in years', () => {
  assert.equal(suggestRenewalDate('2025-01-15', '1 year'), '2026-01-15');
  assert.equal(suggestRenewalDate('2025-01-15', '2 years'), '2027-01-15');
  assert.equal(suggestRenewalDate('2025-01-15', '3 years'), '2028-01-15');
  assert.equal(suggestRenewalDate('2025-01-15', '5 years'), '2030-01-15');
});

test('suggestRenewalDate returns empty for Custom/missing/invalid', () => {
  assert.equal(suggestRenewalDate('2025-01-15', 'Custom'), '');
  assert.equal(suggestRenewalDate('', '1 year'), '');
  assert.equal(suggestRenewalDate('2025-01-15', ''), '');
  assert.equal(suggestRenewalDate('bad-date', '1 year'), '');
});

test('inferLicenseTerm classifies standard spans', () => {
  assert.equal(inferLicenseTerm('2025-01-15', '2026-01-15'), '1 year');
  assert.equal(inferLicenseTerm('2025-01-15', '2027-01-15'), '2 years');
  assert.equal(inferLicenseTerm('2025-01-15', '2028-01-15'), '3 years');
  assert.equal(inferLicenseTerm('2025-01-15', '2030-01-15'), '5 years');
});

test('inferLicenseTerm: non-standard -> Custom, invalid -> empty', () => {
  assert.equal(inferLicenseTerm('2025-01-15', '2025-07-15'), 'Custom'); // ~6 months
  assert.equal(inferLicenseTerm('2025-01-15', '2024-01-15'), '');       // exp before start
  assert.equal(inferLicenseTerm('', '2026-01-15'), '');
  assert.equal(inferLicenseTerm('2025-01-15', ''), '');
});

test('daysUntil: numeric days, negative when overdue, null when missing/invalid', () => {
  assert.equal(daysUntil(dateOffset(10)), 10);
  assert.equal(daysUntil(dateOffset(0)), 0);
  assert.equal(daysUntil(dateOffset(-3)), -3);
  assert.equal(daysUntil(''), null);
  assert.equal(daysUntil('not-a-date'), null);
  assert.equal(daysUntil(undefined), null);
});
