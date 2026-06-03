// C10b-1 — tests for the pure dashboard-metrics aggregator.
// computeDashboardMetrics is tested directly with synthetic records, so no
// RECORD_STORE mock is needed (node:test + node:assert/strict).

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDashboardMetrics } from '../source/store/dashboardMetrics.js';

// YYYY-MM-DD relative to today (local midnight) for deterministic assertions.
function dateOffset(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Build a record with canonical meta only (no positional row coupling).
function rec(meta) {
  return { id: 'x-' + Math.random().toString(36).slice(2), row: [], meta };
}

test('computeDashboardMetrics: no records -> hasLocalData false and zeros', () => {
  const m = computeDashboardMetrics([], 'MSP / Integrator');
  assert.equal(m.hasLocalData, false);
  assert.equal(m.recordCount, 0);
  assert.equal(m.totalExposure, 0);
  assert.equal(m.exposure90d, 0);
  assert.equal(m.expiringSoon30, 0);
  assert.equal(m.criticalCount, 0);
  assert.equal(m.missingOwners, 0);
  assert.equal(m.marginAtRisk, 0);
});

test('computeDashboardMetrics: non-array input is treated as empty', () => {
  const m = computeDashboardMetrics(undefined, 'MSP / Integrator');
  assert.equal(m.hasLocalData, false);
  assert.equal(m.recordCount, 0);
});

test('computeDashboardMetrics: exposure sums commercialValue (parses $ and commas)', () => {
  const m = computeDashboardMetrics([
    rec({ commercialValue: '$42,800', expirationRenewalDate: dateOffset(20), owner: 'Maria' }),
    rec({ commercialValue: '100000', expirationRenewalDate: dateOffset(60), owner: 'Luis' }),
  ], 'MSP / Integrator');
  assert.equal(m.hasLocalData, true);
  assert.equal(m.recordCount, 2);
  assert.equal(m.totalExposure, 142800);
  assert.equal(m.exposure90d, 142800); // both within 90 days
});

test('computeDashboardMetrics: exposure90d excludes records beyond 90 days', () => {
  const m = computeDashboardMetrics([
    rec({ commercialValue: '50000', expirationRenewalDate: dateOffset(30), owner: 'A' }),  // in 90
    rec({ commercialValue: '70000', expirationRenewalDate: dateOffset(200), owner: 'B' }), // beyond 90
  ], 'MSP / Integrator');
  assert.equal(m.totalExposure, 120000);
  assert.equal(m.exposure90d, 50000);
});

test('computeDashboardMetrics: expiringSoon30 counts records in 0..30 days only', () => {
  const m = computeDashboardMetrics([
    rec({ expirationRenewalDate: dateOffset(10), owner: 'A' }),  // counts
    rec({ expirationRenewalDate: dateOffset(30), owner: 'B' }),  // counts (boundary)
    rec({ expirationRenewalDate: dateOffset(45), owner: 'C' }),  // no
    rec({ expirationRenewalDate: dateOffset(-5), owner: 'D' }),  // overdue, not "expiring soon"
  ], 'MSP / Integrator');
  assert.equal(m.expiringSoon30, 2);
});

test('computeDashboardMetrics: criticalCount uses derived risk (overdue/<=7/critical)', () => {
  const m = computeDashboardMetrics([
    rec({ expirationRenewalDate: dateOffset(-3), owner: 'A' }),                         // overdue -> Critical
    rec({ expirationRenewalDate: dateOffset(5), owner: 'B' }),                          // <=7 -> Critical
    rec({ expirationRenewalDate: dateOffset(200), businessCriticality: 'Critical', owner: 'C' }), // criticality -> Critical
    rec({ expirationRenewalDate: dateOffset(200), owner: 'D' }),                        // Low
  ], 'MSP / Integrator');
  assert.equal(m.criticalCount, 3);
});

test('computeDashboardMetrics: missingOwners counts blank/dash/Unassigned', () => {
  const m = computeDashboardMetrics([
    rec({ owner: 'Ana Ruiz', expirationRenewalDate: dateOffset(40) }),
    rec({ owner: 'Unassigned', expirationRenewalDate: dateOffset(40) }),
    rec({ owner: '', expirationRenewalDate: dateOffset(40) }),
    rec({ owner: '-', expirationRenewalDate: dateOffset(40) }),
    rec({ expirationRenewalDate: dateOffset(40) }), // owner undefined
  ], 'MSP / Integrator');
  assert.equal(m.missingOwners, 4);
});

test('computeDashboardMetrics: marginAtRisk sums margin for records expiring within 90 days', () => {
  const m = computeDashboardMetrics([
    rec({ commercialValue: '100', vendorCost: '60', expirationRenewalDate: dateOffset(30) }), // +40
    rec({ commercialValue: '200', vendorCost: '150', expirationRenewalDate: dateOffset(60) }), // +50
    rec({ commercialValue: '500', vendorCost: '100', expirationRenewalDate: dateOffset(200) }), // beyond 90 -> ignored
  ], 'MSP / Integrator');
  assert.equal(m.marginAtRisk, 90);
});

test('computeDashboardMetrics: zero vendor cost yields full-value margin (C10a-fix)', () => {
  const m = computeDashboardMetrics([
    rec({ commercialValue: '100', vendorCost: '0', expirationRenewalDate: dateOffset(20) }),
  ], 'MSP / Integrator');
  assert.equal(m.marginAtRisk, 100); // 100% margin counted, not dropped
});

test('computeDashboardMetrics: records with no/invalid date do not break aggregation', () => {
  const m = computeDashboardMetrics([
    rec({ commercialValue: '1000', owner: 'A' }),                       // no date
    rec({ commercialValue: '2000', expirationRenewalDate: 'bad', owner: 'B' }), // invalid date
  ], 'Internal IT');
  assert.equal(m.recordCount, 2);
  assert.equal(m.totalExposure, 3000);
  assert.equal(m.exposure90d, 0);     // no valid dates -> nothing within 90
  assert.equal(m.expiringSoon30, 0);
});
